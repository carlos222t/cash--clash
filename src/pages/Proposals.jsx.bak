import React, { useState, useEffect } from 'react';
import { auth, entities } from '@/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Plus, Send, MessageSquare, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Proposals() {
  const [user, setUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewDialog, setReviewDialog] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [form, setForm] = useState({ title: '', description: '', monthly_income: '', savings_goal: '', reviewer_email: '' });
  const queryClient = useQueryClient();

  useEffect(() => { auth.me().then(setUser).catch(() => {}); }, []);

  const { data: profiles } = useQuery({
    queryKey: ['profile'],
    queryFn: () => entities.UserProfile.filter({ created_by: user?.id }),
    enabled: !!user?.id,
    initialData: [],
  });

  const { data: proposals } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => entities.Proposal.list('-created_date', 50),
    enabled: !!user?.id,
    initialData: [],
  });

  const profile = profiles?.[0];
  const myProposals = proposals.filter(p => p.student_email === user?.email);
  const reviewProposals = proposals.filter(p => p.teacher_email === user?.email);

  const handleSubmit = async () => {
    await entities.Proposal.create({
      ...form,
      monthly_income: parseFloat(form.monthly_income) || 0,
      savings_goal: parseFloat(form.savings_goal) || 0,
      student_email: user.email,
      student_name: user.full_name,
      teacher_email: form.reviewer_email,
      status: 'pending',
    });
    queryClient.invalidateQueries({ queryKey: ['proposals'] });
    setDialogOpen(false);
    setForm({ title: '', description: '', monthly_income: '', savings_goal: '', reviewer_email: '' });
    toast.success('Proposal submitted!');
  };

  const handleReview = async (proposalId, status) => {
    await entities.Proposal.update(proposalId, { status, feedback });
    queryClient.invalidateQueries({ queryKey: ['proposals'] });
    setReviewDialog(null);
    setFeedback('');
    toast.success(`Proposal ${status === 'approved' ? 'approved' : 'reviewed'}!`);
  };

  const statusBadge = (status) => {
    const config = {
      pending: { class: 'bg-chart-3/10 text-chart-3 border-chart-3/20', label: 'Pending' },
      approved: { class: 'bg-primary/10 text-primary border-primary/20', label: 'Approved' },
      needs_revision: { class: 'bg-accent/10 text-accent border-accent/20', label: 'Needs Revision' },
      rejected: { class: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Rejected' },
    };
    const c = config[status] || config.pending;
    return <Badge variant="outline" className={c.class}>{c.label}</Badge>;
  };

  const ProposalCard = ({ proposal, showReview }) => (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base font-heading">{proposal.title}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            by {proposal.student_name} · {proposal.created_date && format(new Date(proposal.created_date), 'MMM d, yyyy')}
          </p>
        </div>
        {statusBadge(proposal.status)}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{proposal.description}</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {proposal.monthly_income > 0 && (
            <div className="bg-muted/50 rounded-lg p-2">
              <p className="text-xs text-muted-foreground">Monthly Income</p>
              <p className="font-semibold">${proposal.monthly_income}</p>
            </div>
          )}
          {proposal.savings_goal > 0 && (
            <div className="bg-muted/50 rounded-lg p-2">
              <p className="text-xs text-muted-foreground">Savings Goal</p>
              <p className="font-semibold">${proposal.savings_goal}</p>
            </div>
          )}
        </div>
        {proposal.feedback && (
          <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
            <p className="text-xs font-semibold text-accent mb-1">Feedback</p>
            <p className="text-sm">{proposal.feedback}</p>
          </div>
        )}
        {showReview && proposal.status === 'pending' && (
          <Button variant="outline" size="sm" className="w-full" onClick={() => { setReviewDialog(proposal); setFeedback(''); }}>
            <MessageSquare className="w-4 h-4 mr-2" /> Review
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> Proposals
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Submit budget plans for peer review</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Proposal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Submit Budget Proposal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-xs">Title</Label>
                <Input placeholder="e.g. Monthly Budget Plan - March" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea placeholder="Describe your budget plan..." rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Monthly Income ($)</Label>
                  <Input type="number" placeholder="0" value={form.monthly_income} onChange={e => setForm({ ...form, monthly_income: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Savings Goal ($)</Label>
                  <Input type="number" placeholder="0" value={form.savings_goal} onChange={e => setForm({ ...form, savings_goal: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Reviewer's Email</Label>
                <Input type="email" placeholder="reviewer@example.com" value={form.reviewer_email} onChange={e => setForm({ ...form, reviewer_email: e.target.value })} />
              </div>
              <Button onClick={handleSubmit} className="w-full gap-2">
                <Send className="w-4 h-4" /> Submit Proposal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="my">
        <TabsList>
          <TabsTrigger value="my">My Proposals ({myProposals.length})</TabsTrigger>
          <TabsTrigger value="review">To Review ({reviewProposals.filter(p => p.status === 'pending').length})</TabsTrigger>
        </TabsList>
        <TabsContent value="my" className="mt-4">
          {myProposals.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="font-heading font-semibold">No proposals yet</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {myProposals.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <ProposalCard proposal={p} showReview={false} />
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="review" className="mt-4">
          {reviewProposals.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No proposals assigned for your review</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {reviewProposals.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <ProposalCard proposal={p} showReview={true} />
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!reviewDialog} onOpenChange={(open) => !open && setReviewDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Review: {reviewDialog?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">{reviewDialog?.description}</p>
            <div>
              <Label className="text-xs">Your Feedback</Label>
              <Textarea placeholder="Provide constructive feedback..." rows={3} value={feedback} onChange={e => setFeedback(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleReview(reviewDialog?.id, 'approved')} className="flex-1 gap-1">
                <CheckCircle className="w-4 h-4" /> Approve
              </Button>
              <Button variant="outline" onClick={() => handleReview(reviewDialog?.id, 'needs_revision')} className="flex-1 gap-1">
                <MessageSquare className="w-4 h-4" /> Needs Revision
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
