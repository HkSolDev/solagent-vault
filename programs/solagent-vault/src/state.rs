use anchor_lang::prelude::*;

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
