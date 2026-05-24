use anchor_lang::prelude::*;

pub mod errors;
pub mod state;
pub mod instructions;

use instructions::*;

declare_id!("AgentVault11111111111111111111111111111111");

#[program]
pub mod solagent_vault {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        instructions::initialize_vault::handler(ctx)
    }

    pub fn create_agent(
        ctx: Context<CreateAgent>,
        agent_id: u64,
        agent_signer: Pubkey,
        max_per_call: u64,
        max_per_minute: u64,
        allowed_providers: [Pubkey; 5],
    ) -> Result<()> {
        instructions::create_agent::handler(
            ctx,
            agent_id,
            agent_signer,
            max_per_call,
            max_per_minute,
            allowed_providers,
        )
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64, agent_id: u64) -> Result<()> {
        instructions::deposit::handler(ctx, amount, agent_id)
    }

    pub fn spend(ctx: Context<Spend>, amount: u64, agent_id: u64) -> Result<()> {
        instructions::spend::handler(ctx, amount, agent_id)
    }

    pub fn set_config(
        ctx: Context<SetConfig>,
        status: Option<state::AgentStatus>,
        max_per_call: Option<u64>,
        max_per_minute: Option<u64>,
        allowed_providers: Option<[Pubkey; 5]>,
    ) -> Result<()> {
        instructions::set_config::handler(
            ctx,
            status,
            max_per_call,
            max_per_minute,
            allowed_providers,
        )
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64, agent_id: u64) -> Result<()> {
        instructions::withdraw::handler(ctx, amount, agent_id)
    }

    pub fn close_agent(ctx: Context<CloseAgent>, agent_id: u64) -> Result<()> {
        instructions::close_agent::handler(ctx, agent_id)
    }
}
