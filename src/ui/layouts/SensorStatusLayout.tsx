import React, { FC, ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Row } from '~layouts/Row';
import { COLOUR } from '../../common/constants';
import { Column } from './Column';

interface SensorStatusLayoutProps {
  SensorName: ReactNode;
  TemperatureStatus: ReactNode;
  SensorStatusBar: ReactNode;
  CumulativeBreach: ReactNode;
  LastDownload: ReactNode;
  isLoading: ReactNode;
}

export const SensorStatusLayout: FC<SensorStatusLayoutProps> = ({
  SensorName,
  TemperatureStatus,
  SensorStatusBar,
  CumulativeBreach,
  LastDownload,
  isLoading,
}) => {
  return !isLoading ? (
    <Column flex={1}>
      <Row justifyContent="space-between" alignItems="flex-end" flex={1}>
        {SensorName}
        <Row style={{ marginLeft: 5 }} />
        {SensorStatusBar}
      </Row>
      <View>{TemperatureStatus}</View>
      <Column flex={1}>
        {LastDownload}
        {CumulativeBreach}
      </Column>
    </Column>
  ) : (
    <ActivityIndicator size="large" color={COLOUR.PRIMARY} />
  );
};
