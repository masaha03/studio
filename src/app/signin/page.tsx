
"use client";

import { useState, useEffect, useRef } from 'react';
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const dialogEmailRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Confirm the link is a sign-in with email link.
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let emailFromStorage = window.localStorage.getItem('emailForSignIn');
      if (!emailFromStorage) {
        // User opened the link on a different device. To prevent session fixation
        // attacks, ask the user to provide the email again.
        setDialogOpen(true);
        return;
      }
       if (dialogEmailRef.current && dialogEmailRef.current.value) {
        emailFromStorage = dialogEmailRef.current.value;
      }
      if (emailFromStorage) {
        setLoading(true);
        signInWithEmailLink(auth, emailFromStorage, window.location.href)
          .then((result) => {
            window.localStorage.removeItem('emailForSignIn');
            toast({ title: "サインイン成功", description: "ようこそ！" });
            router.push('/'); // Redirect to dashboard or home page
          })
          .catch((err) => {
            console.error(err);
            setError("サインインリンクが無効か、期限切れの可能性があります。もう一度お試しください。");
            toast({ title: "サインインエラー", description: error || "不明なエラーが発生しました。", variant: "destructive" });
            setLoading(false);
          });
      } else {
         setError("メールアドレスが確認できませんでした。");
         toast({ title: "サインインエラー", description: error || "不明なエラーが発生しました。", variant: "destructive" });
         setLoading(false);
      }
    }
  }, [router, toast, error, dialogOpen]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setEmailSent(false);

    const actionCodeSettings = {
      // URL you want to redirect back to. The domain (www.example.com) for this
      // URL must be in the authorized domains list in the Firebase Console.
      url: window.location.origin + '/signin', // Redirect back to signin to complete the flow
      handleCodeInApp: true, // This must be true.
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      // The link was successfully sent. Inform the user.
      // Save the email locally so you don't need to ask the user for it again
      // if they open the link on the same device.
      window.localStorage.setItem('emailForSignIn', email);
      setEmailSent(true);
      toast({ title: "メール送信完了", description: "サインイン用のリンクを記載したメールを送信しました。ご確認ください。" });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "メールの送信に失敗しました。");
      toast({ title: "メール送信エラー", description: error || "不明なエラーが発生しました。", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDialogConfirm = () => {
    if (dialogEmailRef.current && dialogEmailRef.current.value) {
      const email = dialogEmailRef.current.value;
      setLoading(true);
       signInWithEmailLink(auth, email, window.location.href)
          .then((result) => {
            window.localStorage.removeItem('emailForSignIn');
            toast({ title: "サインイン成功", description: "ようこそ！" });
            router.push('/'); // Redirect to dashboard or home page
          })
          .catch((err) => {
            console.error(err);
            setError("サインインリンクが無効か、期限切れの可能性があります。もう一度お試しください。");
            toast({ title: "サインインエラー", description: error || "不明なエラーが発生しました。", variant: "destructive" });
            setLoading(false);
          });
      setDialogOpen(false);
    } else {
      setError("メールアドレスを入力してください。");
    }
  };
  
  const handleDialogClose = () => {
    setDialogOpen(false);
     setError("メールアドレスが確認できませんでした。");
         toast({ title: "サインインエラー", description: error || "不明なエラーが発生しました。", variant: "destructive" });
         setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-primary">自治会役員会ワークスペース</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            メールアドレスを入力してサインインしてください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <p className="text-center text-green-600">
              サインイン用のリンクを記載したメールを送信しました。メールをご確認の上、リンクをクリックしてサインインを完了してください。
            </p>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="focus:ring-primary focus:border-primary"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? '送信中...' : 'サインインリンクを送信'}
              </Button>
            </form>
          )}
           {loading && isSignInWithEmailLink(auth, window.location.href) && (
             <p className="mt-4 text-center text-muted-foreground">サインイン処理中です...</p>
           )}
           <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>メールアドレスの確認</DialogTitle>
                <DialogDescription>
                  確認のため、メールアドレスを再度入力してください。
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      メールアドレス
                    </Label>
                    <Input id="email" type="email" defaultValue="" ref={dialogEmailRef} className="col-span-3" />
                  </div>
                </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={handleDialogClose} >
                  キャンセル
                </Button>
                <Button type="button" onClick={handleDialogConfirm} disabled={loading}>
                  確認
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
