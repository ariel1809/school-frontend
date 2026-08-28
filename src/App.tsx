import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { UsersPage } from '@/pages/users/UsersPage';
import { RolesPage } from '@/pages/users/RolesPage';
import { PermissionsPage } from '@/pages/users/PermissionsPage';
import { AuditPage } from '@/pages/users/AuditPage';
import { EstablishmentPage } from '@/pages/config/EstablishmentPage';
import { AcademicYearsPage } from '@/pages/config/AcademicYearsPage';
import { CurriculumPage } from '@/pages/config/CurriculumPage';
import { StudentsListPage } from '@/pages/students/StudentsListPage';
import { EnrollmentWizardPage } from '@/pages/students/EnrollmentWizardPage';
import { StudentDetailPage } from '@/pages/students/StudentDetailPage';
import { ClassroomsPage } from '@/pages/students/ClassroomsPage';
import { TeachersListPage } from '@/pages/teachers/TeachersListPage';
import { TeacherCreatePage } from '@/pages/teachers/TeacherCreatePage';
import { TeacherDetailPage } from '@/pages/teachers/TeacherDetailPage';
import { FinancialDashboardPage } from '@/pages/billing/FinancialDashboardPage';
import { FeeTypesPage } from '@/pages/billing/FeeTypesPage';
import { InvoicesListPage } from '@/pages/billing/InvoicesListPage';
import { InvoiceCreatePage } from '@/pages/billing/InvoiceCreatePage';
import { InvoiceDetailPage } from '@/pages/billing/InvoiceDetailPage';
import { PaymentsListPage } from '@/pages/billing/PaymentsListPage';
import { SetupWizardPage } from '@/pages/setup/SetupWizardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import React from "react";

function Protected({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/setup"
        element={
          <Protected>
            <SetupWizardPage />
          </Protected>
        }
      />

      <Route
        path="/"
        element={
          <Protected>
            <DashboardLayout />
          </Protected>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="permissions" element={<PermissionsPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="config/establishment" element={<EstablishmentPage />} />
        <Route path="config/academic-years" element={<AcademicYearsPage />} />
        <Route path="config/curriculum" element={<CurriculumPage />} />
        <Route path="students" element={<StudentsListPage />} />
        <Route path="students/enroll" element={<EnrollmentWizardPage />} />
        <Route path="students/:id" element={<StudentDetailPage />} />
        <Route path="classrooms" element={<ClassroomsPage />} />
        <Route path="teachers" element={<TeachersListPage />} />
        <Route path="teachers/new" element={<TeacherCreatePage />} />
        <Route path="teachers/:id" element={<TeacherDetailPage />} />
        <Route path="billing" element={<FinancialDashboardPage />} />
        <Route path="fee-types" element={<FeeTypesPage />} />
        <Route path="invoices" element={<InvoicesListPage />} />
        <Route path="invoices/new" element={<InvoiceCreatePage />} />
        <Route path="invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="payments" element={<PaymentsListPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}