import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ClipboardList, 
  Users, 
  Zap, 
  Smartphone,
  CheckCircle2,
  ArrowRight,
  User
} from "lucide-react";
import appScreenshot from "@/assets/bodyfirm-pt-ui.png";

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
              Your workout spreadsheets.
              <span className="text-primary block">Now digital.</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Stop fighting with complicated fitness apps. BodyFirm PT is the simple workout tracker built for personal trainers who just want to track workouts—nothing more, nothing less.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => navigate("/login")} className="text-lg px-8">
                Start Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm text-muted-foreground self-center">
                Free forever with 1 client. <span className="font-semibold text-foreground">$10/mo</span> for unlimited.
              </p>
            </div>
          </div>
          <div className="relative">
            <img 
              src={appScreenshot} 
              alt="BodyFirm PT workout tracking interface" 
              className="rounded-2xl shadow-2xl border border-border/50"
            />
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
              <img 
                src={appScreenshot} 
                alt="BodyFirm PT workout tracking interface showing exercises organized by muscle groups" 
                className="rounded-2xl shadow-2xl border border-border/50"
              />
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
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-fugaz mb-4">Simple pricing too</h3>
          <p className="text-lg text-muted-foreground">
            Start free, upgrade when you're ready.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h4 className="text-2xl font-semibold mb-1">Free Forever</h4>
                <p className="text-muted-foreground">For trainers just getting started</p>
              </div>
              <div className="space-y-2">
                <p className="text-5xl font-bold">$0</p>
                <p className="text-muted-foreground">forever</p>
              </div>
              <ul className="space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>1 client</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Unlimited workouts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>All features included</span>
                </li>
              </ul>
              <Button size="lg" variant="outline" onClick={() => navigate("/login")} className="w-full">
                Get Started Free
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="border-primary/50 bg-gradient-to-b from-primary/5 to-transparent relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                Most Popular
              </span>
            </div>
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="text-2xl font-semibold mb-1">Pro</h4>
                <p className="text-muted-foreground">For growing training businesses</p>
              </div>
              <div className="space-y-2">
                <p className="text-5xl font-bold">$10</p>
                <p className="text-muted-foreground">per month</p>
              </div>
              <ul className="space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span><strong>Unlimited clients</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Unlimited workouts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>All features included</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Cancel anytime</span>
                </li>
              </ul>
              <Button size="lg" onClick={() => navigate("/login")} className="w-full">
                Upgrade Anytime
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm text-muted-foreground">
                Start free, upgrade when you need more clients
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
