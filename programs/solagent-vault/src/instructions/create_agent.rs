use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::VaultError;

impl<'info> CreateAgent<'info> {
    pub fn create_agent(
        &mut self,
        agent_id: u64,
        max_per_call: u64,
        max_per_minute: u64,
        allowed_providers: [Pubkey; 5],
        sol_allocation: u64,
        bumps: &CreateAgentBumps,
    ) -> Result<()> {
        let agent = &mut self.agent_state;
        agent.vault = self.vault_state.key();
        agent.owner = self.owner.key();
        agent.agent_signer = self.agent_signer.key(); // Store signer public key
        agent.balance = 0;
        agent.status = AgentStatus::Active;
        agent.max_per_call = max_per_call;
        agent.max_per_minute = max_per_minute;
        agent.last_window_start = Clock::get()?.unix_timestamp;
        agent.spent_this_window = 0;
        agent.total_spent = 0;
        agent.allowed_providers = allowed_providers;
        agent.bump = bumps.agent_state; // Access bump from bumps parameter

        // Perform on-chain SOL transfer from Developer -> Agent Keypair
        if sol_allocation > 0 {
            let cpi_context = CpiContext::new(
                self.system_program.key(), // Anchor 1.0.2 expects the program Pubkey directly
                anchor_lang::system_program::Transfer {
                    from: self.owner.to_account_info(),
                    to: self.agent_signer.to_account_info(),
                },
            );
            anchor_lang::system_program::transfer(cpi_context, sol_allocation)?;
        }

        // Increment agent count
        let vault = &mut self.vault_state;
        vault.agent_count = vault.agent_count.checked_add(1).ok_or(error!(VaultError::Overflow))?;

        Ok(())
    }
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

    /// CHECK: The throwaway keypair address of the AI agent.
    /// We mark it mut so it can receive SOL lamports on-chain.
    #[account(mut)]
    pub agent_signer: AccountInfo<'info>,

    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}
