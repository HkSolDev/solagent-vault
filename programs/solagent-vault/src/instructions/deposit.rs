use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, TokenAccount, TokenInterface, Mint, TransferChecked};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::*;
use crate::errors::VaultError;

impl<'info> Deposit<'info> {
    pub fn deposit(&mut self, amount: u64, _agent_id: u64) -> Result<()> {
        // Transfer tokens from developer wallet to Agent ATA
        let cpi_accounts = TransferChecked {
            from: self.owner_token_account.to_account_info(),
            to: self.agent_token_account.to_account_info(),
            authority: self.owner.to_account_info(),
            mint: self.usdc_mint.to_account_info(),
        };
        // In Anchor 1.0.2, CpiContext::new takes the program Pubkey, not its AccountInfo!
        let cpi_ctx = CpiContext::new(self.token_program.key(), cpi_accounts);
        token_interface::transfer_checked(cpi_ctx, amount, self.usdc_mint.decimals)?;

        // Update balance state
        let agent = &mut self.agent_state;
        agent.balance = agent.balance.checked_add(amount).ok_or(error!(VaultError::Overflow))?;

        let vault = &mut self.vault_state;
        vault.total_deposited = vault.total_deposited.checked_add(amount).ok_or(error!(VaultError::Overflow))?;

        Ok(())
    }
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

    #[account(
        mut,
        constraint = owner_token_account.mint == usdc_mint.key(),
        constraint = owner_token_account.owner == owner.key()
    )]
    pub owner_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = owner,
        associated_token::mint = usdc_mint,
        associated_token::authority = agent_state,
        associated_token::token_program = token_program,
    )]
    pub agent_token_account: InterfaceAccount<'info, TokenAccount>,

    pub usdc_mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
