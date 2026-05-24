use anchor_lang::prelude::*;

#[error_code]
pub mod ErrorCode {
    #[msg("Calculation overflowed")]
    Overflow,
    #[msg("Agent is not currently active")]
    AgentNotActive,
    #[msg("This provider is not in the agent's allowlist")]
    ProviderNotAllowed,
    #[msg("Requested amount exceeds single-call limit")]
    ExceedsMaxPerCall,
    #[msg("Requested amount exceeds the per-minute spending limit")]
    ExceedsRateLimit,
    #[msg("Insufficient balance in the agent's token account")]
    InsufficientBalance,
}
