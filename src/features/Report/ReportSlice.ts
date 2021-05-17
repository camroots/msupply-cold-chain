import { SagaIterator } from '@redux-saga/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ToastAndroid } from 'react-native';
import { call, getContext, put, takeEvery } from 'redux-saga/effects';

import { REDUCER, DEPENDENCY } from '../../common/constants';

interface ReportSliceState {
  creating: boolean;
}

interface TryCreatePayload {
  sensorId: string;
  username: string;
  comment: string;
}

interface TryCreateAndEmailPayload {
  sensorId: string;
  username: string;
  comment: string;
}

const initialState: ReportSliceState = { creating: false };

const reducers = {
  tryCreate: {
    prepare: (sensorId: string, username: string, comment: string) => ({
      payload: { sensorId, username, comment },
    }),
    reducer: (draftState: ReportSliceState) => {
      draftState.creating = true;
    },
  },
  createSuccessful: (draftState: ReportSliceState) => {
    draftState.creating = false;
  },
  createFailed: (draftState: ReportSliceState) => {
    draftState.creating = false;
  },
  tryCreateAndEmail: {
    prepare: (sensorId: string, username: string, comment: string) => ({
      payload: { sensorId, username, comment },
    }),
    reducer: (draftState: ReportSliceState) => {
      draftState.creating = true;
    },
  },
  createAndEmailSuccessful: (draftState: ReportSliceState) => {
    draftState.creating = false;
  },
  createAndEmailFailed: (draftState: ReportSliceState) => {
    draftState.creating = false;
  },
};

const { actions: ReportAction, reducer: ReportReducer } = createSlice({
  initialState,
  reducers,
  name: REDUCER.REPORT,
});

function* tryCreate({
  payload: { sensorId, username, comment },
}: PayloadAction<TryCreatePayload>): SagaIterator {
  const DependencyLocator = yield getContext(DEPENDENCY.LOCATOR);
  const reportManager = yield call(DependencyLocator.get, DEPENDENCY.REPORT_MANAGER);

  try {
    const sensor = yield call(reportManager.getSensorById, sensorId);
    const sensorStats = yield call(reportManager.getStats, sensorId);
    const sensorReport = yield call(reportManager.getSensorReport, sensorId);
    const logsReport = yield call(reportManager.getLogsReport, sensorId);
    const breachReport = yield call(reportManager.getBreachReport, sensorId);
    const breachConfigReport = yield call(reportManager.breachConfigReport, sensorId);

    const writtenPath = yield call(
      reportManager.writeLogFile,
      sensor,
      sensorReport,
      sensorStats,
      logsReport,
      breachReport,
      breachConfigReport,
      username,
      comment
    );
    yield put(ReportAction.createSuccessful());
    ToastAndroid.show(`Report written to ${writtenPath}`, ToastAndroid.SHORT);
  } catch (error) {
    yield put(ReportAction.createFailed());
    ToastAndroid.show('Failed to create report.', ToastAndroid.SHORT);
  }
}

function* tryCreateAndEmail({
  payload: { sensorId, username, comment },
}: PayloadAction<TryCreateAndEmailPayload>): SagaIterator {
  const DependencyLocator = yield getContext(DEPENDENCY.LOCATOR);
  const reportManager = yield call(DependencyLocator.get, DEPENDENCY.REPORT_MANAGER);

  try {
    const sensor = yield call(reportManager.getSensorById, sensorId);
    const sensorStats = yield call(reportManager.getStats, sensorId);
    const sensorReport = yield call(reportManager.getSensorReport, sensorId);
    const logsReport = yield call(reportManager.getLogsReport, sensorId);
    const breachReport = yield call(reportManager.getBreachReport, sensorId);
    const breachConfigReport = yield call(reportManager.breachConfigReport, sensorId);

    yield call(
      reportManager.emailLogFile,
      sensor,
      sensorReport,
      sensorStats,
      logsReport,
      breachReport,
      breachConfigReport,
      username,
      comment
    );
    yield put(ReportAction.createAndEmailSuccessful());
  } catch (error) {
    yield put(ReportAction.createAndEmailFailed());
  }
}

function* root(): SagaIterator {
  yield takeEvery(ReportAction.tryCreate, tryCreate);
  yield takeEvery(ReportAction.tryCreateAndEmail, tryCreateAndEmail);
}

const ReportSaga = {
  root,
};

const ReportSelector = {};

export { ReportAction, ReportReducer, ReportSaga, ReportSelector };
