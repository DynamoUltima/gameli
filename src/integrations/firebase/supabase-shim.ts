import { collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc, setDoc, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytes, deleteObject } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from './client';

class QueryBuilder {
  tableName: string;
  filters: any[];
  modifiers: any[];
  isSingle: boolean;
  isCount: boolean;
  isDelete: boolean;
  updateData: any;
  insertData: any;
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' | null;

  constructor(tableName: string) {
    this.tableName = tableName === 'profiles' ? 'users' : tableName;
    this.filters = [];
    this.modifiers = [];
    this.isSingle = false;
    this.isCount = false;
    this.operation = null;
  }

  select(fields?: string) {
    this.operation = 'select';
    return this;
  }

  insert(data: any) {
    this.operation = 'insert';
    this.insertData = data;
    return this;
  }

  update(data: any) {
    this.operation = 'update';
    this.updateData = data;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }
  
  upsert(data: any) {
    this.operation = 'upsert';
    this.insertData = data;
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push(where(field, '==', value));
    return this;
  }

  in(field: string, values: any[]) {
    if (!values || values.length === 0) {
      this.filters.push(where(field, 'in', ['__empty__']));
    } else {
      // Firestore 'in' has a max of 10 items. Chunking may be required in complex apps, but handled simply here.
      if (values.length > 10) values = values.slice(0, 10);
      this.filters.push(where(field, 'in', values));
    }
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.modifiers.push(orderBy(field, options?.ascending === false ? 'desc' : 'asc'));
    return this;
  }

  limit(count: number) {
    this.modifiers.push(limit(count));
    this.isCount = true; 
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  // Act as a Promise so `await` triggers execution
  async then(resolve: any, reject: any) {
    try {
      if (this.operation === 'insert' || this.operation === 'upsert') {
        const items = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
        const results = [];
        for (const item of items) {
          // Check if we provided an ID
          if (item.id || item.user_id) {
            const docId = item.id || item.user_id;
            await setDoc(doc(db, this.tableName, docId), item);
            results.push(item);
          } else {
            const docRef = await addDoc(collection(db, this.tableName), item);
            results.push({ id: docRef.id, ...item });
          }
        }
        return resolve({ 
          error: null, 
          data: Array.isArray(this.insertData) ? results : results[0] 
        });
      }

      const q = query(collection(db, this.tableName), ...this.filters, ...this.modifiers);
      const snapshot = await getDocs(q);

      if (this.operation === 'update') {
        for (const d of snapshot.docs) {
          await updateDoc(doc(db, this.tableName, d.id), this.updateData);
        }
        return resolve({ error: null, data: null });
      }

      if (this.operation === 'delete') {
        for (const d of snapshot.docs) {
          await deleteDoc(doc(db, this.tableName, d.id));
        }
        return resolve({ error: null, data: null });
      }

      // Default operation is select
      let data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      if (this.isCount) {
        return resolve({ count: data.length, data: data, error: null });
      }

      if (this.isSingle) {
        return resolve({ data: data.length > 0 ? data[0] : null, error: null });
      }

      resolve({ data, error: null });
    } catch (error) {
      console.error("Shim Error:", error);
      resolve({ data: null, count: null, error });
    }
  }
}

export const supabase = {
  from: (table: string) => new QueryBuilder(table),
  auth: {
    getSession: async () => {
      // Mock session using current Firebase user
      return { 
        data: { 
          session: auth.currentUser ? { 
            user: auth.currentUser, 
            access_token: await auth.currentUser.getIdToken() 
          } : null 
        } 
      };
    },
    getUser: async () => ({ 
      data: { user: auth.currentUser } 
    }),
    signOut: async () => signOut(auth),
    signUp: async () => ({ error: { message: "Use Firebase Client" } }),
    signInWithPassword: async () => ({ error: { message: "Use Firebase Client" } }),
    resetPasswordForEmail: async () => ({ error: { message: "Use Firebase Client" } }),
    updateUser: async () => ({ error: { message: "Use Firebase Client" } }),
    onAuthStateChange: () => {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => {
        try {
          const fileRef = ref(storage, `${bucket}/${path}`);
          await uploadBytes(fileRef, file);
          return { data: { path }, error: null };
        } catch(error) {
          return { data: null, error };
        }
      },
      getPublicUrl: (path: string) => {
        const projectId = "gameliel-hospital";
        return { 
          data: { 
            publicUrl: `https://firebasestorage.googleapis.com/v0/b/${projectId}.firebasestorage.app/o/${bucket}%2F${encodeURIComponent(path)}?alt=media` 
          } 
        };
      },
      remove: async (paths: string[]) => {
        try {
          for (const path of paths) {
            const fileRef = ref(storage, `${bucket}/${path}`);
            await deleteObject(fileRef);
          }
          return { data: true, error: null };
        } catch(error) {
          return { data: null, error };
        }
      }
    })
  }
};
