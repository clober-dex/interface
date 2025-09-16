import React from 'react'

import { LeaderboardContainer } from '../containers/leaderboard-container'
import RestrictedPageGuard from '../containers/restricted-page-guard'

export default function Leaderboard() {
  return (
    <RestrictedPageGuard>
      <LeaderboardContainer />
    </RestrictedPageGuard>
  )
}
