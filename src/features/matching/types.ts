export type SearchingQueueState = { state: "searching" };

export type ProposalPendingQueueState = {
  state: "proposal-pending";
  data: {
    match_uid: string;
    other_uid: string;
    expires_at: string;
    accepted: boolean;
  };
};

export type MatchedQueueState = {
  state: "matched";
  data: {
    match_uid: string;
    other_uid: string;
  };
};

export type MatchingQueueState =
  | SearchingQueueState
  | ProposalPendingQueueState
  | MatchedQueueState;
