use anchor_lang::prelude::*;

pub mod errors;
pub mod state;
pub mod instructions;

use instructions::*;

declare_id!("AvzxLJP5TatmG2kxs43Yc5uTEFesVfcqWXc5yddv5TK8");

#[program]
pub mod solagent_vault {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        ctx.accounts.initialize_vault(&ctx.bumps)
    }

    pub fn create_agent(
        ctx: Context<CreateAgent>,
        agent_id: u64,
        max_per_call: u64,
        max_per_minute: u64,
        allowed_providers: [Pubkey; 5],
        sol_allocation: u64,
    ) -> Result<()> {
        ctx.accounts.create_agent(
            agent_id,
            max_per_call,
            max_per_minute,
            allowed_providers,
            sol_allocation,
            &ctx.bumps,
        )
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64, agent_id: u64) -> Result<()> {
        ctx.accounts.deposit(amount, agent_id)
    }

    pub fn spend(ctx: Context<Spend>, amount: u64, agent_id: u64) -> Result<()> {
        ctx.accounts.spend(amount, agent_id)
    }

    pub fn set_config(
        ctx: Context<SetConfig>,
        status: Option<state::AgentStatus>,
        max_per_call: Option<u64>,
        max_per_minute: Option<u64>,
        allowed_providers: Option<[Pubkey; 5]>,
    ) -> Result<()> {
        ctx.accounts.set_config(
            status,
            max_per_call,
            max_per_minute,
            allowed_providers,
        )
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64, agent_id: u64) -> Result<()> {
        ctx.accounts.withdraw(amount, agent_id)
    }

    pub fn close_agent(ctx: Context<CloseAgent>, agent_id: u64) -> Result<()> {
        ctx.accounts.close_agent(agent_id)
    }
}
