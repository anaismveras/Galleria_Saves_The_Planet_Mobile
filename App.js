import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Image, PanResponder, Pressable, StyleSheet, Text, View, useWindowDimensions,
} from 'react-native';

const GOAL = 40;
const GAME_SECONDS = 90;
const PENALTY = 3; // trash that falls out of the bag when Galleria bumps a beach goer
const PLAYER = 90;
const ITEM = 60;
const PLAYER_SPEED = 0.6; // px per ms while an arrow button is held
const PLAYER_BOTTOM = 110; // keeps Galleria above the arrow buttons

const galleria = require('./assets/galleria.png');
const TRASH = [require('./assets/trash-bottle.png'), require('./assets/trash-can.png'), require('./assets/trash-bag.png')];
const GOERS = [require('./assets/beachgoer-surfer.png'), require('./assets/beachgoer-sunhat.png'), require('./assets/beachgoer-kid.png')];

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const formatTime = (s) => {
  const t = Math.ceil(s);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};

export default function App() {
  const { width, height } = useWindowDimensions();
  const [screen, setScreen] = useState('start'); // start | playing | won | lost
  const [, setFrame] = useState(0);
  const game = useRef(null);
  const dir = useRef(0); // -1 left, 1 right, 0 still

  const start = () => {
    game.current = { x: width / 2, items: [], score: 0, timeLeft: GAME_SECONDS, spawnIn: 0, nextId: 0, flash: 0 };
    setScreen('playing');
  };

  // Main game loop
  useEffect(() => {
    if (screen !== 'playing') return undefined;
    let raf;
    let last = Date.now();
    const playerY = height - PLAYER - PLAYER_BOTTOM;

    const tick = () => {
      const now = Date.now();
      const dt = Math.min(now - last, 50);
      last = now;
      const g = game.current;
      const elapsed = GAME_SECONDS - g.timeLeft;
      const speed = 0.18 + elapsed * 0.004; // items fall faster over time

      g.timeLeft -= dt / 1000;
      g.flash = Math.max(0, g.flash - dt);
      g.x = Math.min(width - PLAYER / 2, Math.max(PLAYER / 2, g.x + dir.current * PLAYER_SPEED * dt));

      g.spawnIn -= dt;
      if (g.spawnIn <= 0) {
        const isTrash = Math.random() < 0.65;
        g.items.push({
          id: g.nextId++, isTrash, img: pick(isTrash ? TRASH : GOERS),
          x: ITEM / 2 + Math.random() * (width - ITEM), y: -ITEM,
        });
        g.spawnIn = Math.max(350, 900 - elapsed * 6);
      }

      g.items = g.items.filter((item) => {
        item.y += speed * dt;
        const hit = Math.abs(item.x - g.x) < (PLAYER + ITEM) / 2 - 20
          && Math.abs(item.y + ITEM / 2 - (playerY + PLAYER / 2)) < (PLAYER + ITEM) / 2 - 20;
        if (hit) {
          if (item.isTrash) g.score += 1;
          else { g.score = Math.max(0, g.score - PENALTY); g.flash = 400; }
          return false;
        }
        return item.y < height;
      });

      if (g.score >= GOAL) return setScreen('won');
      if (g.timeLeft <= 0) return setScreen('lost');
      setFrame((f) => f + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [screen, width, height]);

  // Drag anywhere to slide Galleria
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => { if (game.current) game.current.x = e.nativeEvent.pageX; },
    onPanResponderMove: (e) => { if (game.current) game.current.x = e.nativeEvent.pageX; },
  })).current;

  const g = game.current;

  return (
    <View style={styles.beach}>
      <StatusBar style="dark" />
      <View style={styles.ocean} />

      {screen === 'playing' && g && (
        <View style={StyleSheet.absoluteFill} {...pan.panHandlers}>
          {g.items.map((item) => (
            <Image key={item.id} source={item.img} style={[styles.item, { left: item.x - ITEM / 2, top: item.y }]} />
          ))}
          <Image
            source={galleria}
            style={[styles.player, { left: g.x - PLAYER / 2, top: height - PLAYER - PLAYER_BOTTOM }, g.flash > 0 && styles.hurt]}
          />
          <View style={styles.hud}>
            <Text style={styles.hudText}>🗑️ {g.score}/{GOAL}</Text>
            <Text style={styles.hudText}>⏱️ {formatTime(Math.max(0, g.timeLeft))}</Text>
          </View>
          <View style={styles.controls}>
            {[['◀', -1], ['▶', 1]].map(([label, d]) => (
              <Pressable key={label} style={styles.arrow} onPressIn={() => { dir.current = d; }} onPressOut={() => { dir.current = 0; }}>
                <Text style={styles.arrowText}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {screen !== 'playing' && (
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Image source={galleria} style={styles.cardImage} />
            <Text style={styles.title}>
              {{ start: 'Galleria Saves the Planet', won: 'You saved the beach! 🌍', lost: "Time's up!" }[screen]}
            </Text>
            <Text style={styles.body}>
              {screen === 'start'
                ? `Slide Galleria left and right to pick up ${GOAL} pieces of trash in ${formatTime(GAME_SECONDS)}. Bumping into beach goers knocks ${PENALTY} pieces out of the bag!`
                : `Galleria picked up ${g.score}/${GOAL} pieces of trash.`}
            </Text>
            {screen === 'start' && (
              <Text style={styles.hint}>Drag your finger or hold the arrows</Text>
            )}
            <Pressable style={styles.button} onPress={start}>
              <Text style={styles.buttonText}>{screen === 'start' ? 'Start Game' : 'Play Again'}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  beach: { flex: 1, backgroundColor: '#FDE68A', overflow: 'hidden' },
  ocean: { position: 'absolute', top: 0, left: 0, right: 0, height: 70, backgroundColor: '#2DD4BF', borderBottomWidth: 10, borderColor: '#CCFBF1' },
  item: { position: 'absolute', width: ITEM, height: ITEM },
  player: { position: 'absolute', width: PLAYER, height: PLAYER },
  hurt: { opacity: 0.4 },
  hud: { position: 'absolute', top: 44, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  hudText: { backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, fontSize: 18, fontWeight: '800', color: '#0F766E', overflow: 'hidden' },
  controls: { position: 'absolute', bottom: 24, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  arrow: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(15,118,110,0.25)', alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 28, color: '#0F766E' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(15,118,110,0.35)' },
  card: { width: '100%', maxWidth: 380, backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center' },
  cardImage: { width: 120, height: 120 },
  title: { fontSize: 26, fontWeight: '900', color: '#0F766E', textAlign: 'center', marginVertical: 8 },
  body: { fontSize: 16, color: '#374151', textAlign: 'center', lineHeight: 22 },
  hint: { fontSize: 13, color: '#6B7280', marginTop: 8 },
  button: { marginTop: 20, backgroundColor: '#22C55E', paddingVertical: 14, paddingHorizontal: 36, borderRadius: 999 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
