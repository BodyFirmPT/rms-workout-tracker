import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ClipboardList, 
  Users, 
  Zap, 
  Smartphone,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: ClipboardList,
      title: "Digital Workout Sheets",
      description: "The same simple format you've been using on paper or spreadsheets—now on your phone or tablet. No learning curve."
    },
    {
      icon: Users,
      title: "Unlimited Clients",
      description: "Track as many clients as you want. No per-client fees, no limits. One flat price."
    },
    {
      icon: Zap,
      title: "Quick Entry",
      description: "Add exercises in seconds. Copy from previous workouts. Duplicate and adjust. Save time, not add complexity."
    },
    {
      icon: Smartphone,
      title: "Works Everywhere",
      description: "Use it on your phone during sessions, on your tablet, or on your computer. Your workouts sync automatically."
    }
  ];

  const benefits = [
    "No complicated features you'll never use",
    "Looks like the sheets you already know",
    "Track sets, reps, weights, and notes",
    "Copy workouts between clients",
    "Print workout summaries when needed",
    "Access workout history anytime"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-fugaz text-primary">BodyFirm PT</h1>
          <Button onClick={() => navigate("/login")} variant="outline">
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-fugaz leading-tight">
              Your workout sheets.
              <span className="text-primary block">Now digital.</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Stop fighting with complicated fitness apps. BodyFirm PT is the simple workout tracker built for personal trainers who just want to track workouts—nothing more, nothing less.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => navigate("/login")} className="text-lg px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm text-muted-foreground self-center">
                Then just <span className="font-semibold text-foreground">$10/month</span> for unlimited everything
              </p>
            </div>
          </div>
          <div className="relative">
            {/* Image Placeholder */}
            <div className="aspect-[4/3] bg-muted rounded-2xl border-2 border-dashed border-border flex items-center justify-center">
              <p className="text-muted-foreground text-center p-8">
                Hero Image Placeholder<br />
                <span className="text-sm">(App screenshot or trainer with tablet)</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h3 className="text-3xl md:text-4xl font-fugaz">
              Built for trainers who hate complicated software
            </h3>
            <p className="text-lg text-muted-foreground">
              You've tried the big fitness apps. They want you to track macros, build meal plans, 
              create exercise videos, manage payments, and a hundred other things you don't need. 
              You just want to write down what your client did today—like you've always done.
            </p>
            <p className="text-lg font-medium text-primary">
              That's exactly what BodyFirm PT does. Nothing more.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-fugaz mb-4">Simple by design</h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every feature exists to save you time, not add complexity.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-border/50 bg-card/50">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Screenshot Section */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              {/* Image Placeholder */}
              <div className="aspect-[3/4] bg-background rounded-2xl border-2 border-dashed border-border flex items-center justify-center shadow-lg">
                <p className="text-muted-foreground text-center p-8">
                  App Screenshot Placeholder<br />
                  <span className="text-sm">(Workout tracking interface)</span>
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-3xl md:text-4xl font-fugaz">
                Looks familiar?<br />It should.
              </h3>
              <p className="text-lg text-muted-foreground">
                We designed BodyFirm PT to look like the workout sheets you've been using for years. 
                Muscle groups, exercises, sets, reps, weights, notes. That's it.
              </p>
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto">
          <Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <h3 className="text-3xl md:text-4xl font-fugaz">Simple pricing too</h3>
              <div className="space-y-2">
                <p className="text-6xl font-bold">$10</p>
                <p className="text-xl text-muted-foreground">per month</p>
              </div>
              <ul className="space-y-2 text-lg">
                <li className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Unlimited clients
                </li>
                <li className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Unlimited workouts
                </li>
                <li className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  All features included
                </li>
                <li className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Cancel anytime
                </li>
              </ul>
              <Button size="lg" onClick={() => navigate("/login")} className="text-lg px-8">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm text-muted-foreground">
                No credit card required to start
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h3 className="text-3xl md:text-4xl font-fugaz">
            Ready to ditch the spreadsheets?
          </h3>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Join personal trainers who've simplified their workout tracking without sacrificing the format they know and love.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate("/login")} 
            className="text-lg px-8"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="font-fugaz text-foreground mb-2">BodyFirm PT</p>
          <p className="text-sm">Simple workout tracking for personal trainers</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
