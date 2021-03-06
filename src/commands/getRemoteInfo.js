import { GitRemoteHTTP } from '../managers/GitRemoteHTTP.js'

/**
 * List a remote servers branches, tags, and capabilities.
 *
 * @link https://isomorphic-git.github.io/docs/getRemoteInfo.html
 */
export async function getRemoteInfo ({
  url,
  authUsername,
  authPassword,
  noGitSuffix = false,
  username = authUsername,
  password = authPassword,
  token,
  oauth2format
}) {
  try {
    let auth = { username, password, token, oauth2format }
    const remote = await GitRemoteHTTP.discover({
      service: 'git-upload-pack',
      url,
      noGitSuffix,
      auth
    })
    const result = {}
    // Note: remote.capabilities, remote.refs, and remote.symrefs are Set and Map objects,
    // but one of the objectives of the public API is to always return JSON-compatible objects
    // so we must JSONify them.
    result.capabilities = [...remote.capabilities]
    // Convert the flat list into an object tree, because I figure 99% of the time
    // that will be easier to use.
    for (const [ref, oid] of remote.refs) {
      let parts = ref.split('/')
      let last = parts.pop()
      let o = result
      for (let part of parts) {
        o[part] = o[part] || {}
        o = o[part]
      }
      o[last] = oid
    }
    // Merge symrefs on top of refs to more closely match actual git repo layouts
    for (const [symref, ref] of remote.symrefs) {
      let parts = symref.split('/')
      let last = parts.pop()
      let o = result
      for (let part of parts) {
        o[part] = o[part] || {}
        o = o[part]
      }
      o[last] = ref
    }
    return result
  } catch (err) {
    err.caller = 'git.getRemoteInfo'
    throw err
  }
}
