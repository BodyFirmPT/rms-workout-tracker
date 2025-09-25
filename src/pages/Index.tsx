import { ClientSelector } from "@/components/dashboard/client-selector";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Workout Tracker
          </h1>
          <p className="text-lg text-muted-foreground">
            Select a client to view their training sessions and create new workouts
          </p>
        </div>
        
        <ClientSelector />
      </div>
    </div>
  );
};

export default Index;
