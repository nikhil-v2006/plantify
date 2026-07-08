'use client';

import {
  GoogleAuthProvider,
  OAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase/provider';
import { saveUserToFirestore } from '@/firebase/user-actions';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleAuthAction = (
    action: Promise<any>,
    successMessage: string,
    errorMessagePrefix: string
  ) => {
    setIsSubmitting(true);
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        return action;
      })
      .then(result => {
        saveUserToFirestore(firestore, result.user);
        toast({ title: 'Success', description: successMessage });
        const redirectUrl = searchParams.get('redirect') || '/dashboard';
        router.replace(redirectUrl);
      })
      .catch(error => {
        if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
          console.error(`${errorMessagePrefix} Error:`, error);
          toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: error.message || 'An unknown error occurred.',
          });
        }
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const onEmailSubmit = (values: z.infer<typeof formSchema>) => {
    handleAuthAction(
      signInWithEmailAndPassword(auth, values.email, values.password),
      'Successfully signed in!',
      'Email Sign-In'
    );
  };

  const handleCreateAccount = () => {
    const { email, password } = form.getValues();
    form.trigger().then(isValid => {
      if (isValid) {
        handleAuthAction(
          createUserWithEmailAndPassword(auth, email, password),
          'Account created successfully!',
          'Account Creation'
        );
      }
    });
  };

  const handleGoogleSignIn = () => {
    const provider = new GoogleAuthProvider();
    handleAuthAction(
      signInWithPopup(auth, provider),
      'Signed in with Google!',
      'Google Sign-In'
    );
  };

  const handleLinkedInSignIn = () => {
    const provider = new OAuthProvider('linkedin.com');
    handleAuthAction(
      signInWithPopup(auth, provider),
      'Signed in with LinkedIn!',
      'LinkedIn Sign-In'
    );
  };

  const handleGitHubSignIn = () => {
    const provider = new GithubAuthProvider();
    handleAuthAction(
      signInWithPopup(auth, provider),
      'Signed in with GitHub!',
      'GitHub Sign-In'
    );
  };

  const handleAnonymousSignIn = () => {
    handleAuthAction(
      signInAnonymously(auth),
      'Signed in as guest.',
      'Anonymous Sign-In'
    );
  };

  useEffect(() => {
    // If the user is already authenticated, redirect them away from the login page.
    if (!isUserLoading && user) {
      const redirectUrl = searchParams.get('redirect') || '/dashboard';
      router.replace(redirectUrl);
    }
  }, [user, isUserLoading, router, searchParams]);

  if (isUserLoading || (!isUserLoading && user)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center space-y-6">
        <div className="flex items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Logo className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-headline font-bold text-foreground">
            Field Master
          </h1>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Sign in to your account
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Choose a provider below or use your email.
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onEmailSubmit)}
            className="w-full space-y-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleCreateAccount}
                disabled={isSubmitting}
              >
                Create Account
              </Button>
            </div>
          </form>
        </Form>

        <div className="relative w-full">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
            OR
          </span>
        </div>

        <div className="grid w-full gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
          >
            <svg
              className="mr-2 h-4 w-4"
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 261.8 0 120.5 109.8 8 244 8c66.8 0 126 25.5 169.3 65.5l-69.2 67.5C313.4 112.2 280.3 96 244 96c-85.6 0-154.5 68.4-154.5 152.9s68.9 152.9 154.5 152.9c98.2 0 130.5-73.4 134.9-110.1H244v-90h236.4c4.8 25.2 7.6 51.1 7.6 78z"
              ></path>
            </svg>
            Sign in with Google
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGitHubSignIn}
            disabled={isSubmitting}
          >
            <svg
              className="mr-2 h-4 w-4"
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 496 512"
            >
              <path
                fill="currentColor"
                d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3.3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
              ></path>
            </svg>
            Sign in with GitHub
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLinkedInSignIn}
            disabled={isSubmitting}
          >
            <svg
              className="mr-2 h-4 w-4"
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 448 512"
            >
              <path
                fill="currentColor"
                d="M100.3 448H7.4V148.9h92.9V448zM53.8 108.1C24.1 108.1 0 83.5 0 53.8 0 24.1 24.1 0 53.8 0s53.8 24.1 53.8 54.3c0 29.7-24.1 54.3-53.8 54.3zM448 448h-92.7V302.4c0-34.7-.7-79.2-48.3-79.2-48.3 0-55.7 37.7-55.7 76.7V448h-92.8V148.9h89.1v40.8h1.3c12.4-23.5 42.7-48.3 87.9-48.3 94 0 111.3 61.9 111.3 142.3V448z"
              ></path>
            </svg>
            Sign in with LinkedIn
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleAnonymousSignIn}
            disabled={isSubmitting}
          >
            Continue as Guest
          </Button>
        </div>
      </div>
    </div>
  );
}
