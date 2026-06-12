import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppFooter from './AppFooter';
import AppHeader from './AppHeader';

type MainTabLayoutProps = {
  children: ReactNode;
};

const HIDE_HEADER_PATHS = ['/group', '/private', '/profile'];

export default function MainTabLayout({ children }: MainTabLayoutProps) {
  const pathname = usePathname();

  const shouldHideHeader = HIDE_HEADER_PATHS.includes(pathname);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {!shouldHideHeader && <AppHeader />}

      <View style={styles.content}>
        {children}
      </View>

      <AppFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});