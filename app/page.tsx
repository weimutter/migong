import MazeGame from "@/components/MazeGame";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <main className="flex flex-col gap-8 row-start-2 items-center w-full max-w-4xl">
        <div className="text-center space-y-2">
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            在线迷宫挑战
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            你能走出这个随机生成的迷宫吗？
          </p>
        </div>
        
        <MazeGame />
        
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
        <p>Created by Next.js & Tailwind CSS</p>
      </footer>
    </div>
  );
}
