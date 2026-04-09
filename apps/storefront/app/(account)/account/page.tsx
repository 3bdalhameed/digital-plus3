import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { User, Mail, Phone, Shield } from 'lucide-react'

export const metadata: Metadata = { title: 'حسابي' }

export default async function AccountPage() {
  const session = await auth()
  const user = session?.user

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-primary-dark mb-6">حسابي</h1>

      <div className="card-purple p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-purple rounded-full flex items-center justify-center text-white font-bold text-2xl">
            {user?.name?.charAt(0) || 'م'}
          </div>
          <div>
            <h2 className="font-bold text-primary-dark text-lg">{user?.name || 'المستخدم'}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-gray-400">البريد الإلكتروني</p>
              <p className="font-medium text-gray-700">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-gray-400">المصادقة الثنائية</p>
              <p className="font-medium text-gray-500">غير مفعّلة (قريباً)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
