import { collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc, setDoc, orderBy, limit as firestoreLimit, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, deleteObject, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from './client';

// Tables that map directly to Firestore collections
const TABLE_MAP: Record<string, string> = {
  profiles: 'users',
  user_roles: 'users', // user_roles queries are rerouted to the users collection
};

// Fields to remap per virtual table
const FIELD_MAP: Record<string, Record<string, string>> = {
  user_roles: {
    user_id: 'id', // user_roles.user_id → users.id
    role: 'role',
  },
};

// Result shape transform per virtual table
const toUserRole = (d: any) => ({ user_id: d.id, role: d.role, created_at: d.created_at });

class QueryBuilder {
  tableName: string;
  firestoreTable: string;
  isVirtualTable: boolean;
  filters: any[];
  modifiers: any[];
  orderFields: { field: string; dir: 'asc' | 'desc' }[];
  isSingle: boolean;
  isCount: boolean;
  limitCount: number | null;
  updateData: any;
  insertData: any;
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' | null;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.firestoreTable = TABLE_MAP[tableName] || tableName;
    this.isVirtualTable = tableName === 'user_roles';
    this.filters = [];
    this.modifiers = [];
    this.orderFields = [];
    this.isSingle = false;
    this.isCount = false;
    this.limitCount = null;
    this.operation = null;
  }

  select(_fields?: string) {
    if (!this.operation) {
      this.operation = 'select';
    }
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
    // Remap user_roles.user_id → users.id handled in then()
    const mappedField = this.isVirtualTable && field === 'user_id' ? 'id' : field;
    this.filters.push(where(mappedField, '==', value));
    return this;
  }

  in(field: string, values: any[]) {
    const mappedField = this.isVirtualTable && field === 'user_id' ? 'id' : field;
    if (!values || values.length === 0) {
      this.filters.push(where(mappedField, 'in', ['__EMPTY_PLACEHOLDER__']));
    } else {
      // Firestore 'in' supports up to 30 items in v9+
      if (values.length > 30) values = values.slice(0, 30);
      this.filters.push(where(mappedField, 'in', values));
    }
    return this;
  }

  neq(field: string, value: any) {
    this.filters.push(where(field, '!=', value));
    return this;
  }

  gte(field: string, value: any) {
    this.filters.push(where(field, '>=', value));
    return this;
  }

  lte(field: string, value: any) {
    this.filters.push(where(field, '<=', value));
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    const dir = options?.ascending === false ? 'desc' : 'asc';
    this.modifiers.push(orderBy(field, dir));
    this.orderFields.push({ field, dir });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    this.modifiers.push(firestoreLimit(count));
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
  async then(resolve: any, _reject: any) {
    try {
      if (this.operation === 'insert' || this.operation === 'upsert') {
        const items = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
        const results = [];
        for (const item of items) {
          if (item.id || item.user_id) {
            const docId = item.id || item.user_id;
            await setDoc(doc(db, this.firestoreTable, docId), item, { merge: true });
            results.push(item);
          } else {
            const docRef = await addDoc(collection(db, this.firestoreTable), item);
            results.push({ id: docRef.id, ...item });
          }
        }
        return resolve({
          error: null,
          data: Array.isArray(this.insertData) ? results : results[0],
        });
      }

      // Detect eq('id', ...) filter — 'id' is the Firestore document ID, not a
      // stored field, so we must use direct doc references instead of a query.
      const idFilter = this.filters.find(
        (f) => f._field?.segments?.[0] === 'id' && f._value !== undefined
      );
      const directDocId: string | null = idFilter?._value ?? null;

      let data: any[] = [];

      // Handle empty placeholder (in query with 0 items)
      const hasEmptyPlaceholder = this.filters.some(
        (f) => Array.isArray(f._value) && f._value.includes('__EMPTY_PLACEHOLDER__')
      );

      if (hasEmptyPlaceholder) {
        data = [];
      } else if (directDocId && (this.operation === 'update' || this.operation === 'delete' || this.isSingle || !this.operation)) {
        // Fast path: direct doc reference by Firestore document ID
        if (this.operation === 'update') {
          await updateDoc(doc(db, this.firestoreTable, directDocId), this.updateData);
          return resolve({ error: null, data: null });
        }
        if (this.operation === 'delete') {
          await deleteDoc(doc(db, this.firestoreTable, directDocId));
          return resolve({ error: null, data: null });
        }
        // select single by id
        const docSnap = await getDoc(doc(db, this.firestoreTable, directDocId));
        if (docSnap.exists()) {
          const docData = docSnap.data() as any;
          if (this.tableName === 'profiles') {
            if (!docData.full_name && (docData.first_name || docData.last_name)) {
              docData.full_name = `${docData.first_name || ''} ${docData.other_name ? docData.other_name + ' ' : ''}${docData.last_name || ''}`.replace(/\s+/g, ' ').trim();
            }
          }
          data = [{ id: docSnap.id, ...docData }];
        }
      } else {

        let snapshot: any;
        try {
          const q = query(collection(db, this.firestoreTable), ...this.filters, ...this.modifiers);
          snapshot = await getDocs(q);
        } catch (queryErr: any) {
          // Firestore throws when orderBy is used on a field that lacks an index
          // or is missing from some documents. Retry without order modifiers and
          // sort client-side using orderFields instead.
          console.warn(`Shim: orderBy query failed for "${this.firestoreTable}", retrying without order:`, queryErr?.message);
          const q = query(collection(db, this.firestoreTable), ...this.filters);
          snapshot = await getDocs(q);
        }

        if (this.operation === 'update') {
          for (const d of snapshot.docs) {
            await updateDoc(doc(db, this.firestoreTable, d.id), this.updateData);
          }
          return resolve({ error: null, data: null });
        }

        if (this.operation === 'delete') {
          for (const d of snapshot.docs) {
            await deleteDoc(doc(db, this.firestoreTable, d.id));
          }
          return resolve({ error: null, data: null });
        }

        data = snapshot.docs.map((d: any) => {
          const docData = d.data();
          if (this.tableName === 'profiles') {
            if (!docData.full_name && (docData.first_name || docData.last_name)) {
               docData.full_name = `${docData.first_name || ''} ${docData.other_name ? docData.other_name + ' ' : ''}${docData.last_name || ''}`.replace(/\s+/g, ' ').trim();
            }
          }
          return { id: d.id, ...docData };
        });

        // Client-side sort fallback using stored orderFields meta
        if (this.orderFields.length > 0) {
          data.sort((a: any, b: any) => {
            for (const { field, dir } of this.orderFields) {
              const aVal = a[field] ?? '';
              const bVal = b[field] ?? '';
              const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
              if (cmp !== 0) return dir === 'desc' ? -cmp : cmp;
            }
            return 0;
          });
        }

        // Apply limit client-side as safety net
        if (this.limitCount !== null) {
          data = data.slice(0, this.limitCount);
        }
      }

      // Transform result shape for virtual tables
      if (this.isVirtualTable) {
        data = data.map(toUserRole);
      }

      // Count mode
      if (this.limitCount !== null && !this.isSingle) {
        return resolve({ count: data.length, data, error: null });
      }

      if (this.isSingle) {
        return resolve({ data: data.length > 0 ? data[0] : null, error: null });
      }

      resolve({ count: data.length, data, error: null });
    } catch (error) {
      console.error('Shim Error:', error);
      resolve({ data: null, count: 0, error });
    }
  }
}

export const supabase = {
  from: (table: string) => new QueryBuilder(table),
  auth: {
    getSession: async () => ({
      data: {
        session: auth.currentUser
          ? { user: auth.currentUser, access_token: await auth.currentUser.getIdToken() }
          : null,
      },
    }),
    getUser: async () => ({ data: { user: auth.currentUser } }),
    signOut: async () => signOut(auth),
    signUp: async () => ({ error: { message: 'Use Firebase Client directly' } }),
    signInWithPassword: async () => ({ error: { message: 'Use Firebase Client directly' } }),
    resetPasswordForEmail: async () => ({ error: { message: 'Use Firebase Client directly' } }),
    updateUser: async () => ({ error: { message: 'Use Firebase Client directly' } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => {
        try {
          const fileRef = ref(storage, `${bucket}/${path}`);
          await uploadBytes(fileRef, file);
          return { data: { path }, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      getPublicUrl: (path: string) => {
        const projectId = 'gameliel-hospital';
        return {
          data: {
            publicUrl: `https://firebasestorage.googleapis.com/v0/b/${projectId}.firebasestorage.app/o/${encodeURIComponent(`${bucket}/${path}`)}?alt=media`,
          },
        };
      },
      remove: async (paths: string[]) => {
        try {
          for (const path of paths) {
            const fileRef = ref(storage, `${bucket}/${path}`);
            await deleteObject(fileRef);
          }
          return { data: true, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
    }),
  },
};
