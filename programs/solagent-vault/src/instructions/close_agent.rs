use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, TokenAccount, TokenInterface, Mint, TransferChecked};
use crate::state::*;
use crate::errors::VaultError;

impl<'info> CloseAgent<'info> {
    pub fn close_agent(&mut self, agent_id: u64) -> Result<()> {
        let agent = &self.agent_state;
        let vault = &mut self.vault_state;

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

            let cpi_accounts = TransferChecked {
                from: self.agent_token_account.to_account_info(),
                to: self.owner_token_account.to_account_info(),
                authority: self.agent_state.to_account_info(),
                mint: self.usdc_mint.to_account_info(),
            };
            // In Anchor 1.0.2, CpiContext::new_with_signer takes the program Pubkey, not its AccountInfo!
            let cpi_ctx = CpiContext::new_with_signer(self.token_program.key(), cpi_accounts, signer);
            token_interface::transfer_checked(cpi_ctx, amount, self.usdc_mint.decimals)?;
        }

        // Decrement agent count in vault
        vault.agent_count = vault.agent_count.checked_sub(1).ok_or(error!(VaultError::Overflow))?;

        Ok(())
    }
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
