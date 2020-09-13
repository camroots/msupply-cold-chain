import { combineReducers } from 'redux';
import { SensorReducer } from '~sensor';
import { SettingReducer } from '~setting';
import { BreachConfigurationReducer } from '~breachConfiguration';
import { ChartReducer } from '../../features/chart';
import { BreachReducer } from '../../features/breach';
import { LogTableReducer } from '../../features/logTable';
import { BluetoothReducer } from '../../features/Bluetooth';
import { REDUCER } from '../constants';
import { ReportReducer } from '../../features/Report';
import { SensorStatusReducer } from '../../features/SensorStatus';

export const RootReducer = combineReducers({
  [REDUCER.SENSOR]: SensorReducer,
  [REDUCER.SETTING]: SettingReducer,
  [REDUCER.BREACH_CONFIGURATION]: BreachConfigurationReducer,
  [REDUCER.CHART]: ChartReducer,
  [REDUCER.BREACH]: BreachReducer,
  [REDUCER.LOG_TABLE]: LogTableReducer,
  [REDUCER.BLUETOOTH]: BluetoothReducer,
  [REDUCER.REPORT]: ReportReducer,
  [REDUCER.SENSOR_STATUS]: SensorStatusReducer,
});
