import React, { FC, useEffect, useState } from 'react';
import { ToastAndroid } from 'react-native';
import * as Yup from 'yup';
import { LogLevel } from 'react-native-file-logger';
import {
  SettingsButtonRow,
  SettingsGroup,
  SettingsSwitchRow,
  SettingsTextInputRow,
} from '~components/settings';
import { SettingsList } from '~layouts';
import { useDependency } from '~hooks';
import { DEPENDENCY } from '~constants';
import { FileLoggerService } from '~common/services';
import { SettingsSelectRow } from '~components/settings/SettingsSelectRow';
import { ENVIRONMENT } from '~common/constants';

const fromValue = (value: string) => {
  switch (value) {
    case 'debug':
      return LogLevel.Debug;
    case 'info':
      return LogLevel.Info;
    case 'warn':
      return LogLevel.Warn;
    case 'error':
      return LogLevel.Error;
  }
};

const toValue = (level: LogLevel) => {
  switch (level) {
    case LogLevel.Debug:
      return 'debug';
    case LogLevel.Info:
      return 'info';
    case LogLevel.Warn:
      return 'warn';
    case LogLevel.Error:
      return 'error';
  }
};

export const DebugSettingsScreen: FC = () => {
  const loggerService: FileLoggerService = useDependency(
    DEPENDENCY.LOGGER_SERVICE
  ) as FileLoggerService;

  const [to, setTo] = useState();
  const [enabled, setEnabled] = useState(loggerService.enabled);
  const [captureConsole, setCaptureConsole] = useState(loggerService.captureConsole);
  const [logLevel, setLogLevel] = useState(toValue(loggerService.logLevel));
  const options = [
    { label: 'Debug', value: 'debug' },
    { label: 'Info', value: 'info' },
    { label: 'Warn', value: 'warn' },
    { label: 'Error', value: 'error' },
  ];

  useEffect(() => {
    loggerService.enabled = enabled;
  }, [loggerService, enabled]);

  useEffect(() => {
    loggerService.setLogLevel(fromValue(logLevel));
  }, [loggerService, logLevel]);

  useEffect(() => {
    loggerService.setCaptureConsole(captureConsole);
  }, [loggerService, captureConsole]);

  return (
    <SettingsList>
      <SettingsGroup title="Debug logging">
        <SettingsSwitchRow
          label="Enable"
          isOn={enabled}
          onPress={() => setEnabled(!enabled)}
          isDisabled={ENVIRONMENT.DEV_LOGGER}
        />
      </SettingsGroup>
      {enabled && (
        <>
          <SettingsSelectRow
            label="Logging Level"
            options={options}
            onChange={setLogLevel}
            value={logLevel}
          />
          <SettingsSwitchRow
            label="Capture console"
            isOn={captureConsole}
            onPress={() => setCaptureConsole(!captureConsole)}
          />
          <SettingsGroup title="Email logs">
            <SettingsTextInputRow
              label="Email recipient"
              value={to}
              onConfirm={({ inputValue }: { inputValue: string }) => setTo(inputValue)}
              validation={Yup.string().email()}
            />
            <SettingsButtonRow
              isDisabled={!to}
              label="Send logs"
              onPress={() =>
                loggerService
                  .emailLogFiles({ to })
                  .then(() => ToastAndroid.show(`Logs emailed to ${to}`, ToastAndroid.LONG))
              }
            />
          </SettingsGroup>
        </>
      )}
    </SettingsList>
  );
};
