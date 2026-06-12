import dayjs from 'dayjs';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import DateStrip from '@/src/components/date/DataStrip';
import SowahLogo from '@/src/assets/images/sowah-logo.svg';

export default function AppHeader() {
  const currentMonth = dayjs().format('MMMM');
  const currentYear = dayjs().format('YYYY');

  return (
    <View style={styles.header}>
      <View style={styles.logoArea}>
        <SowahLogo width={127} height={64} />
      </View>

      <View style={styles.monthRow}>
        <Text style={styles.monthText}>
          {currentMonth} <Text style={styles.yearText}>{currentYear}</Text>
        </Text>

        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.joinText}>JOIN NEW EVENTS</Text>
        </TouchableOpacity>
      </View>

      <DateStrip />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  logoArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  logoIcon: {
    fontSize: 32,
    lineHeight: 34,
  },
  logoText: {
    marginTop: -8,
    fontSize: 13,
    fontWeight: '800',
    color: '#111111',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  monthText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111111',
  },
  yearText: {
    color: '#FF9F5A',
  },
  joinText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#111111',
  },
});