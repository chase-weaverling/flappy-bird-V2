import Head from "next/head";
import GameCanvas from "@/components/GameCanvas";
import styles from "@/styles/Home.module.css";

// Game dimensions - make these easily configurable if needed later
const GAME_WIDTH = 512;
const GAME_HEIGHT = 512;

export default function Home() {
  return (
    <>
      <Head>
        <title>Zula's Adventure</title>
        <meta name="description" content="A Flappy Bird style game featuring Zula the cat." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.mainContainer}>
        <GameCanvas width={GAME_WIDTH} height={GAME_HEIGHT} />
      </main>
    </>
  );
}
