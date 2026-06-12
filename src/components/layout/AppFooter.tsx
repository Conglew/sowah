import { router, usePathname } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type FooterItem = {
  label: string;
  icon: string;
  path: '/(tabs)' | '/(tabs)/group' | '/(tabs)/private' | '/(tabs)/profile';
};

const footerItems: FooterItem[] = [
  {
    label: 'Home',
    icon: '⌂',
    path: '/(tabs)',
  },
  {
    label: 'Group',
    icon: '♚',
    path: '/(tabs)/group',
  },
  {
    label: 'Private',
    icon: '✈',
    path: '/(tabs)/private',
  },
  {
    label: 'Profile',
    icon: '●',
    path: '/(tabs)/profile',
  },
];

export default function AppFooter() {
  const pathname = usePathname();

  const isActive = (path: FooterItem['path']) => {
    if (path === '/(tabs)') {
      return pathname === '/' || pathname === '/index';
    }

    return pathname.includes(path.replace('/(tabs)', ''));
  };

  return (
    <View style={styles.footer}>
      <View style={styles.sideItems}>
        {footerItems.slice(0, 2).map((item) => {
          const active = isActive(item.path);

          return (
            <TouchableOpacity
              key={item.path}
              activeOpacity={0.75}
              style={styles.footerItem}
              onPress={() => router.push(item.path)}
            >
              <Text style={[styles.iconText, active && styles.iconTextActive]}>
                {item.icon}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.playButton}
        // onPress={() => router.push('/(tabs)/private')}
      >
        <Text style={styles.playText}>PLAY</Text>
        <Text style={styles.playSubText}>1V1 MATCH</Text>
      </TouchableOpacity>

      <View style={styles.sideItems}>
        {footerItems.slice(2).map((item) => {
          const active = isActive(item.path);

          return (
            <TouchableOpacity
              key={item.path}
              activeOpacity={0.75}
              style={styles.footerItem}
              onPress={() => router.push(item.path)}
            >
              <Text style={[styles.iconText, active && styles.iconTextActive]}>
                {item.icon}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    height: 76,
    paddingHorizontal: 22,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideItems: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  footerItem: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 26,
    color: '#111111',
  },
  iconTextActive: {
    color: '#FF8A22',
  },
  playButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    marginHorizontal: 10,
    backgroundColor: '#FF8A22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: '#FFE4C7',
    shadowColor: '#FF8A22',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  playText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  playSubText: {
    fontSize: 6,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});