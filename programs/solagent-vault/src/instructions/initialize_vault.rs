use anchor_lang::prelude::*;
use crate::state::*;

pub fn handler(ctx: Context<InitializeVault>) -> Result<()> {
    let vault = &mut ctx.accounts.vault_state;
    vault.owner = ctx.accounts.owner.key();
    vault.agent_count = 0;
    vault.total_deposited = 0;
    vault.bump = ctx.bumps.vault_state;
    Ok(())
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
