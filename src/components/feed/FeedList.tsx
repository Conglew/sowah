import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useHomeFeedControlStore } from "@/src/features/home/stores/home-feed-control.store";

type MockPost = {
  id: string;
  username: string;
  timeAgo: string;
  content: string;
};

const createMockPosts = (): MockPost[] => {
  return Array.from({ length: 12 }, (_, index) => ({
    id: `post-${index + 1}`,
    username: `User ${index + 1}`,
    timeAgo: `${index + 1} min ago`,
    content: `Mock post content ${index + 1}`,
  }));
};

export default function FeedList() {
  const listRef = useRef<FlashListRef<MockPost>>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetFeedToken = useHomeFeedControlStore(
    (state) => state.resetFeedToken,
  );

  const [refreshing, setRefreshing] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [listHeight, setListHeight] = useState(0);

  const postMinHeight = listHeight > 0 ? listHeight * 0.86 : 420;

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;

    setListHeight((prevHeight) => {
      if (Math.abs(prevHeight - nextHeight) < 1) {
        return prevHeight;
      }

      return nextHeight;
    });
  }, []);

  const posts = useMemo(() => {
    return createMockPosts().map((post) => ({
      ...post,
      content:
        refreshCount === 0
          ? post.content
          : `${post.content} · refreshed ${refreshCount}`,
    }));
  }, [refreshCount]);

  const refreshPosts = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    setRefreshing(true);

    refreshTimeoutRef.current = setTimeout(() => {
      setRefreshCount((prev) => prev + 1);
      setRefreshing(false);
      refreshTimeoutRef.current = null;
    }, 1200);
  }, []);

  const handleRefresh = useCallback(() => {
    refreshPosts();
  }, [refreshPosts]);

  useEffect(() => {
    if (resetFeedToken === 0) {
      return;
    }

    listRef.current?.scrollToOffset({
      offset: 0,
      animated: true,
    });

    refreshPosts();
  }, [resetFeedToken, refreshPosts]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <FlashList
        ref={listRef}
        data={posts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF8A22"
            colors={["#FF8A22"]}
          />
        }
        renderItem={({ item }) => {
          return <FeedPostBox post={item} minHeight={postMinHeight} />;
        }}
      />
    </View>
  );
}

type FeedPostBoxProps = {
  post: MockPost;
  minHeight: number;
};

function FeedPostBox({ post, minHeight }: FeedPostBoxProps) {
  return (
    <View style={[styles.card, { height: minHeight }]}>
      <View style={styles.mediaBox}>
        <Text style={styles.mediaText}>Post Box</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  card: {
    marginBottom: 18,
    padding: 14,
    borderRadius: 22,
    backgroundColor: "#F6F6F6",
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  cardHeader: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#D9D9D9",
  },
  username: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111111",
  },
  timeAgo: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "500",
    color: "#999999",
  },
  content: {
    marginBottom: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
  },
  mediaBox: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "#D9ECFF",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  actionRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555555",
  },
});
