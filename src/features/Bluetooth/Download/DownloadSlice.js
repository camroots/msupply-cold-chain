import { ToastAndroid } from 'react-native';
import { call, getContext, put, takeEvery, fork, take, race, all, delay } from 'redux-saga/effects';
import { createSlice } from '@reduxjs/toolkit';

import { DEPENDENCY, REDUCER } from '~constants';

import { CumulativeBreachAction, ConsecutiveBreachAction } from '../../Breach';

const initialState = {
  downloadingById: {},
  passiveDownloadEnabled: false,
};

const reducers = {
  passiveDownloadingStart: draftState => {
    draftState.enabled = true;
  },
  passiveDownloadingStop: draftState => {
    draftState.enabled = false;
  },
  downloadStart: {
    prepare: sensorId => ({ payload: { sensorId } }),
    reducer: (draftState, { payload: { sensorId } }) => {
      draftState.downloadingById[sensorId] = true;
    },
  },
  downloadComplete: {
    prepare: sensorId => ({ payload: { sensorId } }),
    reducer: (draftState, { payload: { sensorId } }) => {
      draftState.downloadingById[sensorId] = false;
    },
  },
  tryManualDownloadForSensor: {
    prepare: sensorId => ({ payload: { sensorId } }),
    reducer: () => {},
  },
  manualDownloadForSensorSuccess: {
    prepare: sensorId => ({ payload: { sensorId } }),
    reducer: () => {},
  },
  manualDownloadForSensorFail: {
    prepare: sensorId => ({ payload: { sensorId } }),
    reducer: () => {},
  },
  tryPassiveDownloadForSensor: {
    prepare: sensorId => ({ payload: { sensorId } }),
    reducer: () => {},
  },
  passiveDownloadForSensorSuccess: {
    prepare: sensorId => ({ payload: { sensorId } }),
    reducer: () => {},
  },
  passiveDownloadForSensorFail: {
    prepare: sensorId => ({ payload: { sensorId } }),
    reducer: () => {},
  },
};

const { actions: DownloadAction, reducer: DownloadReducer } = createSlice({
  initialState,
  reducers,
  name: REDUCER.DOWNLOAD,
});

function* tryManualDownloadForSensor({ payload: { sensorId } }) {
  const DependencyLocator = yield getContext(DEPENDENCY.LOCATOR);
  const [btService, sensorManager, downloadManager] = yield call(DependencyLocator.get, [
    DEPENDENCY.BLUETOOTH,
    DEPENDENCY.SENSOR_MANAGER,
    DEPENDENCY.DOWNLOAD_MANAGER,
  ]);

  const sensor = yield call(sensorManager.getSensorById, sensorId);

  try {
    const [canDownload] = yield call(sensorManager.getCanDownload, sensorId);

    if (canDownload) {
      yield put(DownloadAction.downloadStart(sensorId));

      const { macAddress, logInterval, logDelay, programmedDate } = sensor;
      const logs = yield call(btService.downloadLogsWithRetries, macAddress, 10);
      const mostRecentLogTime = yield call(sensorManager.getMostRecentLogTime, sensorId);
      const numberOfLogsToSave = yield call(
        downloadManager.calculateNumberOfLogsToSave,
        Math.max(mostRecentLogTime + logInterval, logDelay, programmedDate),
        logInterval
      );

      const sensorLogs = yield call(
        downloadManager.createLogs,
        logs,
        sensor,
        numberOfLogsToSave,
        mostRecentLogTime
      );

      yield call(downloadManager.saveLogs, sensorLogs);
      if (numberOfLogsToSave) {
        yield call(btService.updateLogIntervalWithRetries, macAddress, logInterval, 10);
      }

      yield put(ConsecutiveBreachAction.create(sensor));
      yield put(DownloadAction.passiveDownloadForSensorSuccess());
      yield put(CumulativeBreachAction.fetchListForSensor(sensorId));
    } else {
      ToastAndroid.show(`Cannot download logs yet!`, ToastAndroid.SHORT);
      yield put(DownloadAction.passiveDownloadForSensorFail());
    }
  } catch (error) {
    ToastAndroid.show(
      `Could not download temperatures for ${sensor.name ?? sensor.macAddress}`,
      ToastAndroid.SHORT
    );
    yield put(DownloadAction.passiveDownloadForSensorFail());
  }

  yield put(DownloadAction.downloadComplete(sensorId));
}

function* tryPassiveDownloadForSensor({ payload: { sensorId } }) {
  const DependencyLocator = yield getContext(DEPENDENCY.LOCATOR);
  const [btService, sensorManager, downloadManager] = yield call(DependencyLocator.get, [
    DEPENDENCY.BLUETOOTH,
    DEPENDENCY.SENSOR_MANAGER,
    DEPENDENCY.DOWNLOAD_MANAGER,
  ]);

  const sensor = yield call(sensorManager.getSensorById, sensorId);

  try {
    const [canDownload] = yield call(sensorManager.getCanDownload, sensorId);

    if (canDownload) {
      yield put(DownloadAction.downloadStart(sensorId));

      const { macAddress, logInterval, logDelay, programmedDate } = sensor;
      const logs = yield call(btService.downloadLogsWithRetries, macAddress, 10);
      const mostRecentLogTime = yield call(sensorManager.getMostRecentLogTime, sensorId);

      const numberOfLogsToSave = yield call(
        downloadManager.calculateNumberOfLogsToSave,
        Math.max(mostRecentLogTime + logInterval, logDelay, programmedDate),
        logInterval
      );

      const sensorLogs = yield call(
        downloadManager.createLogs,
        logs,
        sensor,
        numberOfLogsToSave,
        mostRecentLogTime
      );

      yield call(downloadManager.saveLogs, sensorLogs);
      if (numberOfLogsToSave) {
        yield call(btService.updateLogIntervalWithRetries, macAddress, logInterval, 10);
      }
      yield put(ConsecutiveBreachAction.create(sensor));
      yield put(DownloadAction.passiveDownloadForSensorSuccess());
      yield put(CumulativeBreachAction.fetchListForSensor(sensorId));
    }
  } catch (error) {
    yield put(DownloadAction.passiveDownloadForSensorFail(error.message));
  }

  yield put(DownloadAction.downloadComplete(sensorId));
}

function* downloadTemperatures() {
  const DependencyLocator = yield getContext(DEPENDENCY.LOCATOR);
  const sensorManager = yield call(DependencyLocator.get, DEPENDENCY.SENSOR_MANAGER);

  try {
    const sensors = yield call(sensorManager.getSensors);
    const mapper = ({ id }) => put(DownloadAction.tryPassiveDownloadForSensor(id, false));
    const actions = sensors.map(mapper);
    yield all(actions);
    // eslint-disable-next-line no-empty
  } catch (error) {}
}

function* stopPassiveDownloading() {
  yield take(DownloadAction.passiveDownloadingStop);
}

function* startPassiveDownloading() {
  while (true) {
    yield call(downloadTemperatures);
    yield delay(60000);
  }
}

function* watchPassiveDownloading() {
  yield take(DownloadAction.passiveDownloadingStart);
  yield race({ start: call(startPassiveDownloading), stop: call(stopPassiveDownloading) });
}

function* root() {
  yield takeEvery(DownloadAction.tryManualDownloadForSensor, tryManualDownloadForSensor);
  yield takeEvery(DownloadAction.tryPassiveDownloadForSensor, tryPassiveDownloadForSensor);
  yield fork(watchPassiveDownloading);
}

const DownloadSaga = { root };
const DownloadSelector = {};

export { DownloadAction, DownloadReducer, DownloadSaga, DownloadSelector };
