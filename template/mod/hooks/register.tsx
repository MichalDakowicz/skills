import type { Register } from 'claude-code'

// Starting point for a mod. Every hook is ($, e, next): `$` is the engine,
// `e` the event's input, `next(e)` runs the rest of the chain.
// API reference: .claude-plugin/types/claude-code/index.d.ts (written by the
// engine when it loads this folder), or `claude plugin validate .`.
export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: '{{name}}',
      description: '{{description}}',
    })

    return next(e)
  })

  on('command.run', { command: '{{name}}' }, async $ => {
    await $.ui.toast('{{title}} is loaded.')

    return { text: '{{title}} is loaded.' }
  })
}
