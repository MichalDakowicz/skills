export type Bar = { text: string; isDone: boolean }
export type Area = { name: string; bars: Bar[] }
export type Goal = {
  statement: string
  status: string
  setOn: string
  areas: Area[]
}
export type Section = { name: string; done: number; total: number }
export type Tasks = { path: string; sections: Section[] }

/** What the pane draws: one read of docs/orchestrator/ and the task list. */
export type Board = {
  /** Whether docs/orchestrator/ exists in the working directory. */
  isFound: boolean
  goal?: Goal
  tasks?: Tasks
  next?: string
  updatedOn?: string
  readAt: number
}

declare module 'claude-code' {
  interface PluginState {
    'orchestrator-pane': {
      board: Shaped<Board>
      /** Whether the pane lists done bars under their areas. */
      showDone: boolean
      /** Whether the band shows the open bars and tasks under its line. */
      isExpanded: boolean
      /** Whether the orchestrator skill started this session. */
      isStarted: boolean
    }
  }
}
