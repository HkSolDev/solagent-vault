use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, TokenAccount, TokenInterface, Mint, TransferChecked};
use crate::state::*;
use crate::errors::VaultError;

impl<'info> Spend<'info> {
    pub fn spend(&mut self, amount: u64, agent_id: u64) -> Result<()> {
        let current_time = Clock::get()?.unix_timestamp;

        // GUARD 1: Status Check
        require!(
            self.agent_state.status == AgentStatus::Active,
            VaultError::AgentNotActive
        );

        // GUARD 2: Allowlist Check
        let mut is_allowed = true;
        let mut has_allowlist = false;
        for provider in self.agent_state.allowed_providers.iter() {
            if *provider != Pubkey::default() {
                has_allowlist = true;
                if *provider == self.provider_wallet.key() {
                    is_allowed = true;
                    break;
                } else {
                    is_allowed = false;
                }
            }
        }
        if has_allowlist {
            require!(is_allowed, VaultError::ProviderNotAllowed);
        }

        // GUARD 3: Single-call Cap Check
        require!(
            amount <= self.agent_state.max_per_call,
            VaultError::ExceedsMaxPerCall
        );

        // GUARD 4: Rate Limit Check (Per-minute window)
        let mut spent_this_window = self.agent_state.spent_this_window;
        let mut last_window_start = self.agent_state.last_window_start;
        if current_time - last_window_start >= 60 {
            // New window starts, reset counters
            last_window_start = current_time;
            spent_this_window = 0;
        }

        let new_spent = spent_this_window.checked_add(amount).ok_or(error!(VaultError::Overflow))?;
        require!(
            new_spent <= self.agent_state.max_per_minute,
            VaultError::ExceedsRateLimit
        );

        // GUARD 5: Balance Check
        require!(
            self.agent_state.balance >= amount,
            VaultError::InsufficientBalance
        );

        // All guards passed! Execute CPI USDC Transfer from Agent ATA to Provider ATA
        let vault_key = self.agent_state.vault;
        let agent_bump = self.agent_state.bump;
        let agent_id_bytes = agent_id.to_le_bytes();
        let seeds = &[
            b"agent",
            vault_key.as_ref(),
            agent_id_bytes.as_ref(),
            &[agent_bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = TransferChecked {
            from: self.agent_token_account.to_account_info(),
            to: self.provider_token_account.to_account_info(),
            authority: self.agent_state.to_account_info(),
            mint: self.usdc_mint.to_account_info(),
        };
        // In Anchor 1.0.2, CpiContext::new_with_signer takes the program Pubkey, not its AccountInfo!
        let cpi_ctx = CpiContext::new_with_signer(self.token_program.key(), cpi_accounts, signer);
        token_interface::transfer_checked(cpi_ctx, amount, self.usdc_mint.decimals)?;

        // Update states - borrow mutably only after the CPI has completed and the immutable borrow is dropped
        let agent = &mut self.agent_state;
        agent.balance = agent.balance.checked_sub(amount).ok_or(error!(VaultError::Overflow))?;
        agent.last_window_start = last_window_start;
        agent.spent_this_window = new_spent;
        agent.total_spent = agent.total_spent.checked_add(amount).ok_or(error!(VaultError::Overflow))?;

        emit!(SpendEvent {
            agent: agent.key(),
            provider: self.provider_wallet.key(),
            amount,
            timestamp: current_time,
        });

        Ok(())
    }
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
        constraint = agent_token_account.owner == agent_state.key(),
        constraint = agent_token_account.mint == usdc_mint.key()
    )]
    pub agent_token_account: InterfaceAccount<'info, TokenAccount>,

    pub usdc_mint: InterfaceAccount<'info, Mint>,

    /// CHECK: Target API Provider wallet
    pub provider_wallet: AccountInfo<'info>,

    #[account(
        mut,
        constraint = provider_token_account.owner == provider_wallet.key(),
        constraint = provider_token_account.mint == usdc_mint.key()
    )]
    pub provider_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
}
