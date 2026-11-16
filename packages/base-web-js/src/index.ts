export { BasePage } from './page/BasePage';
export { applyUiMutation } from './mutation/applyUiMutation';
export { waitForResponses } from './network/waitForResponses';

export {
  test,
  expect,
  SharedBrowserError,
  type ReadySharedBrowserState,
  type SharedBrowserWorkerFixtures,
} from './fixtures';

export {
  sharedBrowserProjects,
  setupProjectName,
  teardownProjectName,
  engineFromSetupName,
  engineFromTeardownName,
  engineOfUse,
  SHARED_BROWSER_SETUP_FILE,
  SHARED_BROWSER_TEARDOWN_FILE,
  type SharedBrowserUiProject,
} from './shared-browser/projects';
export {
  startSharedBrowserServer,
  stopSharedBrowserServer,
  formatSharedBrowserStarted,
  formatSharedBrowserSummary,
  SHARED_BROWSER_START_TIMEOUT_MS,
  SHARED_BROWSER_STOP_TIMEOUT_MS,
  type StartSharedBrowserOptions,
  type StopSharedBrowserResult,
} from './shared-browser/lifecycle';
export {
  readReadySharedBrowser,
  toSharedBrowserName,
  waitForSharedBrowserVerdict,
  SHARED_BROWSER_CONNECT_TIMEOUT_MS,
  type SharedBrowserVerdict,
} from './shared-browser/client';
export {
  readSharedBrowserState,
  listSharedBrowserStates,
  listAttachedWorkers,
  isProcessAlive,
  currentRunnerPid,
} from './shared-browser/state';
export type { SharedBrowserName, SharedBrowserLaunchOptions, SharedBrowserState } from './shared-browser/types';

export {
  serveStubPage,
  writeMarkerState,
  readBrowserState,
  fetchLeakProbe,
  type BrowserStateSnapshot,
} from './testing/browserStateProbe';
export { buildStateMarker } from './testing/buildStateMarker';
export * from './testing/sharedBrowserTestData';
