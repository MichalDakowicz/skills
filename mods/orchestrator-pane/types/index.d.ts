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

/** What the band draws: one read of docs/orchestrator/ and the task list. */
export type Board = {
  /** Whether docs/orchestrator/ was found (see `root`). */
  isFound: boolean
  /** The project folder read from when found, else where the search started. */
  root?: string
  goal?: Goal
  tasks?: Tasks
  next?: string
  updatedOn?: string
  readAt: number
}

/** A project folder chosen with `/orchestrator-pane <folder>`; none means search. */
export type Pin = { path?: string }

/** The band above the prompt: what the person chose and what started it. */
export type Band = {
  /** Hidden with `/orchestrator-pane hide`. */
  isHidden: boolean
  /** Showing the open bars and task sections under the glance. */
  isExpanded: boolean
  /** The orchestrator or the command ran: show it before docs exist. */
  isStarted: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'orchestrator-pane': {
      board: Shaped<Board>
      pin: Shaped<Pin>
      band: Shaped<Band>
      /** Whether the opened band lists done bars beside the open ones. */
      showDone: boolean
    }
  }
}
