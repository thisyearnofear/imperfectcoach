
import Header from "@/components/Header";
import VideoFeed from "@/components/VideoFeed";
import ExerciseSelector from "@/components/ExerciseSelector";
import CoachFeedback from "@/components/CoachFeedback";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
          {/* Left Panel: Video and Controls */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <VideoFeed />
            <ExerciseSelector />
          </div>

          {/* Right Panel: Coach Feedback & Stats */}
          <div className="lg:col-span-1">
            <CoachFeedback />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
