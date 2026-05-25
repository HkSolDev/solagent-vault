use anchor_lang::prelude::*;
use crate::state::*;

impl<'info> SetConfig<'info> {
    pub fn set_config(
        &mut self,
        status: Option<AgentStatus>,
        max_per_call: Option<u64>,
        max_per_minute: Option<u64>,
        allowed_providers: Option<[Pubkey; 5]>,
    ) -> Result<()> {
        let agent = &mut self.agent_state;
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
