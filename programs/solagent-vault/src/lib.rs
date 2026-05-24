use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("AgentVault11111111111111111111111111111111");

#[program]
pub mod solagent_vault {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault_state;
        vault.owner = ctx.accounts.owner.key();
        vault.agent_count = 0;
        vault.total_deposited = 0;
        vault.bump = ctx.bumps.vault_state;
        Ok(())
    }

    pub fn create_agent(
        ctx: Context<CreateAgent>,
        agent_id: u64,
        agent_signer: Pubkey,
        max_per_call: u64,
        max_per_minute: u64,
        allowed_providers: [Pubkey; 5],
    ) -> Result<()> {
        let agent = &mut ctx.accounts.agent_state;
        agent.vault = ctx.accounts.vault_state.key();
        agent.owner = ctx.accounts.owner.key();
        agent.agent_signer = agent_signer;
        agent.balance = 0;
        agent.status = AgentStatus::Active;
        agent.max_per_call = max_per_call;
        agent.max_per_minute = max_per_minute;
        agent.last_window_start = Clock::get()?.unix_timestamp;
        agent.spent_this_window = 0;
        agent.total_spent = 0;
        agent.allowed_providers = allowed_providers;
        agent.bump = ctx.bumps.agent_state;

        // Increment agent count
        let vault = &mut ctx.accounts.vault_state;
        vault.agent_count = vault.agent_count.checked_add(1).ok_or(error!(ErrorCode::Overflow))?;

        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64, _agent_id: u64) -> Result<()> {
        // Transfer tokens from developer wallet to Agent ATA
        let cpi_accounts = Transfer {
            from: ctx.accounts.owner_token_account.to_account_info(),
            to: ctx.accounts.agent_token_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Update balance state
        let agent = &mut ctx.accounts.agent_state;
        agent.balance = agent.balance.checked_add(amount).ok_or(error!(ErrorCode::Overflow))?;

        let vault = &mut ctx.accounts.vault_state;
        vault.total_deposited = vault.total_deposited.checked_add(amount).ok_or(error!(ErrorCode::Overflow))?;

        Ok(())
    }

    pub fn spend(ctx: Context<Spend>, amount: u64, agent_id: u64) -> Result<()> {
        let agent = &mut ctx.accounts.agent_state;
        let current_time = Clock::get()?.unix_timestamp;

        // GUARD 1: Status Check
        require!(
            agent.status == AgentStatus::Active,
            ErrorCode::AgentNotActive
        );

        // GUARD 2: Allowlist Check
        let mut is_allowed = true;
        let mut has_allowlist = false;
        for provider in agent.allowed_providers.iter() {
            if *provider != Pubkey::default() {
                has_allowlist = true;
                if *provider == ctx.accounts.provider_wallet.key() {
                    is_allowed = true;
                    break;
                } else {
                    is_allowed = false;
                }
            }
        }
        if has_allowlist {
            require!(is_allowed, ErrorCode::ProviderNotAllowed);
        }

        // GUARD 3: Single-call Cap Check
        require!(
            amount <= agent.max_per_call,
            ErrorCode::ExceedsMaxPerCall
        );

        // GUARD 4: Rate Limit Check (Per-minute window)
        if current_time - agent.last_window_start >= 60 {
            // New window starts, reset counters
            agent.last_window_start = current_time;
            agent.spent_this_window = 0;
        }

        let new_spent = agent.spent_this_window.checked_add(amount).ok_or(error!(ErrorCode::Overflow))?;
        require!(
            new_spent <= agent.max_per_minute,
            ErrorCode::ExceedsRateLimit
        );

        // GUARD 5: Balance Check
        require!(
            agent.balance >= amount,
            ErrorCode::InsufficientBalance
        );

        // All guards passed! Execute CPI USDC Transfer from Agent ATA to Provider ATA
        // Since the Agent PDA is the owner/authority of agent_token_account, we must sign with Agent PDA seeds
        let vault_key = agent.vault;
        let agent_id_bytes = agent_id.to_le_bytes();
        let seeds = &[
            b"agent",
            vault_key.as_ref(),
            agent_id_bytes.as_ref(),
            &[agent.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.agent_token_account.to_account_info(),
            to: ctx.accounts.provider_token_account.to_account_info(),
            authority: ctx.accounts.agent_state.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;

        // Update states
        agent.balance = agent.balance.checked_sub(amount).ok_or(error!(ErrorCode::Overflow))?;
        agent.spent_this_window = new_spent;
        agent.total_spent = agent.total_spent.checked_add(amount).ok_or(error!(ErrorCode::Overflow))?;

        emit!(SpendEvent {
            agent: agent.key(),
            provider: ctx.accounts.provider_wallet.key(),
            amount,
            timestamp: current_time,
        });

        Ok(())
    }

    pub fn set_config(
        ctx: Context<SetConfig>,
        status: Option<AgentStatus>,
        max_per_call: Option<u64>,
        max_per_minute: Option<u64>,
        allowed_providers: Option<[Pubkey; 5]>,
    ) -> Result<()> {
        let agent = &mut ctx.accounts.agent_state;
        if let Some(s) = status {
            agent.status = s;
        }
        if let Some(c) = max_per_call {
            agent.max_per_call = c;
        }
        if let Some(m) = max_per_minute {
            agent.max_per_minute = m;
        }
        if let Some(p) = allowed_providers {
            agent.allowed_providers = p;
        }
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64, agent_id: u64) -> Result<()> {
        let agent = &mut ctx.accounts.agent_state;
        require!(
            agent.balance >= amount,
            ErrorCode::InsufficientBalance
        );

        // CPI transfer from Agent ATA back to owner ATA
        let vault_key = agent.vault;
        let agent_id_bytes = agent_id.to_le_bytes();
        let seeds = &[
            b"agent",
            vault_key.as_ref(),
            agent_id_bytes.as_ref(),
            &[agent.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.agent_token_account.to_account_info(),
            to: ctx.accounts.owner_token_account.to_account_info(),
            authority: ctx.accounts.agent_state.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;

        agent.balance = agent.balance.checked_sub(amount).ok_or(error!(ErrorCode::Overflow))?;

        Ok(())
    }

    pub fn close_agent(ctx: Context<CloseAgent>, agent_id: u64) -> Result<()> {
        let agent = &ctx.accounts.agent_state;
        let vault = &mut ctx.accounts.vault_state;

        // Sweep remaining balance if any to the owner ATA
        if agent.balance > 0 {
            let amount = agent.balance;
            let vault_key = agent.vault;
            let agent_id_bytes = agent_id.to_le_bytes();
            let seeds = &[
                b"agent",
                vault_key.as_ref(),
                agent_id_bytes.as_ref(),
                &[agent.bump],
            ];
            let signer = &[&seeds[..]];

            let cpi_accounts = Transfer {
                from: ctx.accounts.agent_token_account.to_account_info(),
                to: ctx.accounts.owner_token_account.to_account_info(),
                authority: ctx.accounts.agent_state.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::transfer(cpi_ctx, amount)?;
        }

        // Decrement agent count in vault
        vault.agent_count = vault.agent_count.checked_sub(1).ok_or(error!(ErrorCode::Overflow))?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 1 + 8 + 1,
        seeds = [b"vault", owner.key().as_ref()],
        bump
    )]
    pub vault_state: Account<'info, VaultState>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(agent_id: u64)]
pub struct CreateAgent<'info> {
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault_state.bump,
        has_one = owner
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 32 + 32 + 8 + 1 + 8 + 8 + 8 + 8 + 8 + (32 * 5) + 1,
        seeds = [b"agent", vault_state.key().as_ref(), agent_id.to_le_bytes().as_ref()],
        bump
    )]
    pub agent_state: Account<'info, AgentState>,

    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64, agent_id: u64)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault_state.bump,
        has_one = owner
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(
        mut,
        seeds = [b"agent", vault_state.key().as_ref(), agent_id.to_le_bytes().as_ref()],
        bump = agent_state.bump,
        has_one = owner
    )]
    pub agent_state: Account<'info, AgentState>,

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub owner_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = agent_token_account.owner == agent_state.key()
    )]
    pub agent_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(amount: u64, agent_id: u64)]
pub struct Spend<'info> {
    #[account(
        mut,
        seeds = [b"agent", agent_state.vault.as_ref(), agent_id.to_le_bytes().as_ref()],
        bump = agent_state.bump,
        constraint = agent_state.agent_signer == agent_signer.key()
    )]
    pub agent_state: Account<'info, AgentState>,

    #[account(mut)]
    pub agent_signer: Signer<'info>,

    #[account(
        mut,
        constraint = agent_token_account.owner == agent_state.key()
    )]
    pub agent_token_account: Account<'info, TokenAccount>,

    /// CHECK: Target API Provider wallet
    pub provider_wallet: AccountInfo<'info>,

    #[account(
        mut,
        constraint = provider_token_account.owner == provider_wallet.key()
    )]
    pub provider_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SetConfig<'info> {
    #[account(
        mut,
        has_one = owner
    )]
    pub agent_state: Account<'info, AgentState>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(amount: u64, agent_id: u64)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"agent", agent_state.vault.as_ref(), agent_id.to_le_bytes().as_ref()],
        bump = agent_state.bump,
        has_one = owner
    )]
    pub agent_state: Account<'info, AgentState>,

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        constraint = agent_token_account.owner == agent_state.key()
    )]
    pub agent_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub owner_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(agent_id: u64)]
pub struct CloseAgent<'info> {
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault_state.bump,
        has_one = owner
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(
        mut,
        close = owner,
        seeds = [b"agent", vault_state.key().as_ref(), agent_id.to_le_bytes().as_ref()],
        bump = agent_state.bump,
        has_one = owner
    )]
    pub agent_state: Account<'info, AgentState>,

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        constraint = agent_token_account.owner == agent_state.key()
    )]
    pub agent_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub owner_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[account]
pub struct VaultState {
    pub owner: Pubkey,
    pub agent_count: u8,
    pub total_deposited: u64,
    pub bump: u8,
}

#[account]
pub struct AgentState {
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub agent_signer: Pubkey,
    pub balance: u64,
    pub status: AgentStatus,
    pub max_per_call: u64,
    pub max_per_minute: u64,
    pub last_window_start: i64,
    pub spent_this_window: u64,
    pub total_spent: u64,
    pub allowed_providers: [Pubkey; 5],
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum AgentStatus {
    Active,
    Paused,
    Drained,
}

#[event]
pub struct SpendEvent {
    pub agent: Pubkey,
    pub provider: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[error_code]
pub mod ErrorCode {
    #[msg("Calculation overflowed")]
    Overflow,
    #[msg("Agent is not currently active")]
    AgentNotActive,
    #[msg("This provider is not in the agent's allowlist")]
    ProviderNotAllowed,
    #[msg("Requested amount exceeds single-call limit")]
    ExceedsMaxPerCall,
    #[msg("Requested amount exceeds the per-minute spending limit")]
    ExceedsRateLimit,
    #[msg("Insufficient balance in the agent's token account")]
    InsufficientBalance,
}
