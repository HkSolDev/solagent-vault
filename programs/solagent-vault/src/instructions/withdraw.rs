use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, TokenAccount, TokenInterface, Mint, TransferChecked};
use crate::state::*;
use crate::errors::VaultError;

impl<'info> Withdraw<'info> {
    pub fn withdraw(&mut self, amount: u64, agent_id: u64) -> Result<()> {
        require!(
            self.agent_state.balance >= amount,
            VaultError::InsufficientBalance
        );

        // CPI transfer from Agent ATA back to owner ATA
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
            to: self.owner_token_account.to_account_info(),
            authority: self.agent_state.to_account_info(),
            mint: self.usdc_mint.to_account_info(),
        };
        // In Anchor 1.0.2, CpiContext::new_with_signer takes the program Pubkey, not its AccountInfo!
        let cpi_ctx = CpiContext::new_with_signer(self.token_program.key(), cpi_accounts, signer);
        token_interface::transfer_checked(cpi_ctx, amount, self.usdc_mint.decimals)?;

        // Update balance - borrow mutably only after the CPI has completed and the immutable borrow is dropped
        let agent = &mut self.agent_state;
        agent.balance = agent.balance.checked_sub(amount).ok_or(error!(VaultError::Overflow))?;

        Ok(())
    }
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
        constraint = agent_token_account.owner == agent_state.key(),
        constraint = agent_token_account.mint == usdc_mint.key()
    )]
    pub agent_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        constraint = owner_token_account.owner == owner.key(),
        constraint = owner_token_account.mint == usdc_mint.key()
    )]
    pub owner_token_account: InterfaceAccount<'info, TokenAccount>,

    pub usdc_mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
}
