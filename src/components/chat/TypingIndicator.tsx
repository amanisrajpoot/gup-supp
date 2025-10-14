import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';

interface TypingIndicatorProps {
  isVisible: boolean;
  typingUsers: string[];
  maxUsers?: number;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isVisible,
  typingUsers,
  maxUsers = 3,
}) => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isVisible) {
      const animateDots = () => {
        const createAnimation = (dot: Animated.Value, delay: number) => {
          return Animated.loop(
            Animated.sequence([
              Animated.timing(dot, {
                toValue: 1,
                duration: 600,
                delay,
                useNativeDriver: true,
              }),
              Animated.timing(dot, {
                toValue: 0.3,
                duration: 600,
                useNativeDriver: true,
              }),
            ])
          );
        };

        Animated.parallel([
          createAnimation(dot1, 0),
          createAnimation(dot2, 200),
          createAnimation(dot3, 400),
        ]).start();
      };

      animateDots();
    } else {
      dot1.setValue(0.3);
      dot2.setValue(0.3);
      dot3.setValue(0.3);
    }
  }, [isVisible, dot1, dot2, dot3]);

  if (!isVisible || typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    const count = typingUsers.length;
    if (count === 1) {
      return `${typingUsers[0]} is typing`;
    } else if (count === 2) {
      return `${typingUsers[0]} and ${typingUsers[1]} are typing`;
    } else if (count <= maxUsers) {
      const lastUser = typingUsers[count - 1];
      const otherUsers = typingUsers.slice(0, count - 1).join(', ');
      return `${otherUsers} and ${lastUser} are typing`;
    } else {
      return `${typingUsers.slice(0, maxUsers - 1).join(', ')} and ${count - maxUsers + 1} others are typing`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, { opacity: dot1 }]} />
          <Animated.View style={[styles.dot, { opacity: dot2 }]} />
          <Animated.View style={[styles.dot, { opacity: dot3 }]} />
        </View>
        <Text style={styles.text}>{getTypingText()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
    alignItems: 'flex-start',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '80%',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#999',
    marginHorizontal: 1,
  },
  text: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
