import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2, HelpCircle, Database } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  fetchFaqs,
  addFaq,
  updateFaq,
  deleteFaq,
  DEFAULT_FAQS,
  type Faq,
} from "@/lib/faqService";

const emptyForm = { question: "", answer: "", order: 0 };

export function FaqManager() {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [deleteTarget, setDeleteTarget] = useState<Faq | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setFaqs(await fetchFaqs());
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to load FAQs", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, order: faqs.length });
    setDialogOpen(true);
  };

  const openEdit = (faq: Faq) => {
    setEditing(faq);
    setForm({ question: faq.question, answer: faq.answer, order: faq.order });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast({ title: "Question and answer are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        question: form.question.trim(),
        answer: form.answer.trim(),
        order: Number(form.order) || 0,
      };
      if (editing) {
        await updateFaq(editing.id, payload);
        toast({ title: "FAQ updated" });
      } else {
        await addFaq(payload);
        toast({ title: "FAQ added" });
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to save FAQ", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFaq(deleteTarget.id);
      toast({ title: "FAQ deleted" });
      setDeleteTarget(null);
      await load();
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to delete FAQ", variant: "destructive" });
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      await Promise.all(DEFAULT_FAQS.map((f) => addFaq(f)));
      toast({ title: "Default FAQs added" });
      await load();
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to add default FAQs", variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
          <p className="text-sm text-muted-foreground">
            Manage the FAQs shown on the public help page.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add FAQ
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading FAQs...
        </div>
      ) : faqs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <HelpCircle className="w-10 h-10 text-muted-foreground" />
            <div>
              <p className="font-medium">No FAQs yet</p>
              <p className="text-sm text-muted-foreground">
                Visitors currently see the built-in default FAQs. Add your own or
                seed the defaults to start editing them.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSeedDefaults} disabled={seeding}>
                {seeding ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Database className="w-4 h-4 mr-2" />
                )}
                Seed default FAQs
              </Button>
              <Button onClick={openAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Add FAQ
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <Card key={faq.id}>
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="font-medium">{faq.question}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {faq.answer}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(faq)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(faq)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="faq-question">Question</Label>
              <Input
                id="faq-question"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="e.g. How long is my payment valid?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faq-answer">Answer</Label>
              <Textarea
                id="faq-answer"
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                rows={5}
                placeholder="Write the answer shown to patients..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faq-order">Display order</Label>
              <Input
                id="faq-order"
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first on the FAQ page.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? "Save changes" : "Add FAQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this FAQ?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.question}" will be permanently removed from the FAQ page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
