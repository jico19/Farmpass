import LoadingField from '../../components/ui/LoadingField';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import useAuthStore from '../../store/authStore';
import { useGetMaps } from '../../hooks/useMaps';
import {
    Bell,
    Save,
    Smartphone,
    UserCircle,
    MapPin,
    SlidersHorizontal,
    Building2,
    UserCog,
    Mail,
    Loader2,
    CheckCircle2,
} from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import MunicipalSystemConfig from './MunicipalSystemConfig';
import SignatoriesSection from './SignatoriesSection';

const AUTHORIZED_SYSTEM_ROLES = ['Agri', 'Admin'];

const TABS = [
    {
        key: 'profile',
        label: 'Personal Profile',
        icon: UserCircle,
    },
    {
        key: 'system',
        label: 'Municipal Configuration',
        title: 'Municipal System Configuration',
        icon: SlidersHorizontal,
        systemOnly: true,
    },
    {
        key: 'signatories',
        label: 'Signatories',
        icon: UserCog,
        systemOnly: true,
    },
];

/** Shared page width, matching the other single-record configuration views. */
const PAGE_WIDTH = 'max-w-5xl mx-auto px-6 md:px-10';

/**
 * Universal Settings Hub — Role-Gated & Consolidated
 * - Standard users (Farmers, Barangay Officials, OPVs, Inspectors): Personal Profile & Preferences.
 * - Authorized users (Agri, Admin): Personal Profile + Municipal Configuration + Signatories.
 */
const SettingsPage = () => {
    const { user: authUser } = useAuthStore();
    const { profile, isLoading, updateProfile, isUpdating } = useProfile(authUser?.id);
    const { data: barangays } = useGetMaps();

    const [searchParams, setSearchParams] = useSearchParams();
    const canAccessSystemSettings = AUTHORIZED_SYSTEM_ROLES.includes(authUser?.role);

    const tabs = TABS.filter((tab) => !tab.systemOnly || canAccessSystemSettings);

    // Unknown or unauthorized values fall back to the profile tab, so a stale
    // ?tab= link can never strand a user on a tab they cannot see.
    const tabParam = searchParams.get('tab');
    const activeTab = tabs.some((tab) => tab.key === tabParam) ? tabParam : 'profile';

    const handleTabChange = (tabKey) => {
        setSearchParams({ tab: tabKey });
    };

    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const [pendingProfile, setPendingProfile] = useState(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [verificationError, setVerificationError] = useState('');
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [isVerifyingCode, setIsVerifyingCode] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        if (profile) {
            reset({
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                email: profile.email || '',
                phone_no: profile.phone_no || '',
                address: profile.address || '',
                barangay: profile.barangay || '',
                receive_sms: profile.receive_sms ?? true,
            });
        }
    }, [profile, reset]);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => setResendCooldown((value) => value - 1), 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const sendVerificationCode = async (email) => {
        setIsSendingCode(true);
        setVerificationError('');
        try {
            const response = await api.post('/user/request_email_verification/', { email });
            setResendCooldown(60);
            toast.success('Verification Code Sent', { description: response.data.detail });
            return true;
        } catch (error) {
            const message = error.response?.data?.error || 'Could not send the verification code.';
            setVerificationError(message);
            toast.error('Email Verification Failed', { description: message });
            return false;
        } finally {
            setIsSendingCode(false);
        }
    };

    const onSubmit = async (data) => {
        if (profile?.email) {
            updateProfile(data);
            return;
        }

        setPendingProfile(data);
        if (await sendVerificationCode(data.email)) {
            setVerificationCode('');
        }
    };

    const confirmEmail = async (event) => {
        event.preventDefault();
        setIsVerifyingCode(true);
        setVerificationError('');
        try {
            await api.post('/user/confirm_email_verification/', {
                email: pendingProfile.email,
                code: verificationCode,
            });
            updateProfile(pendingProfile);
            setPendingProfile(null);
            setVerificationCode('');
        } catch (error) {
            setVerificationError(error.response?.data?.error || 'Could not verify this code.');
        } finally {
            setIsVerifyingCode(false);
        }
    };

    const isFarmer = authUser?.role === 'Farmer';

    // Only the profile tab depends on the profile request; the municipal tabs
    // should open without waiting on it.
    const renderProfileTab = () => {

        return (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" aria-busy={isLoading}>
                {isLoading && <span role="status" className="sr-only">Loading profile...</span>}
                {/* Personal Info Card */}
                <section className="bg-white border border-stone-200 rounded-xl shadow-xs overflow-hidden">
                    <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex items-center gap-3">
                        <div className="p-1.5 bg-green-50 border border-green-200 rounded-lg">
                            <UserCircle size={16} className="text-green-700" />
                        </div>
                        <h2 className="text-xs font-bold text-stone-800 uppercase tracking-wide">Personal Details</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label htmlFor="first-name-input" className="block text-xs font-semibold text-stone-600">First Name</label>
                            <LoadingField loading={isLoading}><input
                                id="first-name-input"
                                {...register("first_name")}
                                className="w-full h-10 px-3 bg-white border border-stone-200 rounded-lg shadow-2xs text-sm text-stone-900 focus:outline-none focus:border-green-700"
                            /></LoadingField>
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="last-name-input" className="block text-xs font-semibold text-stone-600">Last Name</label>
                            <LoadingField loading={isLoading}><input
                                id="last-name-input"
                                {...register("last_name")}
                                className="w-full h-10 px-3 bg-white border border-stone-200 rounded-lg shadow-2xs text-sm text-stone-900 focus:outline-none focus:border-green-700"
                            /></LoadingField>
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <div className="flex items-center justify-between gap-3">
                                <label htmlFor="email-input" className="block text-xs font-semibold text-stone-600">Email Address</label>
                                {profile?.email_verified_at && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 animate-in fade-in zoom-in-95 duration-200">
                                        <CheckCircle2 size={12} /> Verified
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                <LoadingField loading={isLoading}><input
                                    id="email-input"
                                    type="email"
                                    autoComplete="email"
                                    {...register("email", {
                                        required: "Email address is required",
                                        pattern: { value: /^\S+@\S+\.\S+$/, message: "Please enter a valid email address" },
                                    })}
                                    className={`w-full h-10 pl-10 pr-3 bg-white border rounded-lg shadow-2xs text-sm text-stone-900 focus:outline-none focus:border-green-700 ${errors.email ? 'border-red-400' : 'border-stone-200'}`}
                                /></LoadingField>
                            </div>
                            {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
                            {profile?.email_verified_at ? (
                                <p className="text-[11px] text-stone-500">Verified for password reset emails.</p>
                            ) : (
                                <p className="text-[11px] text-stone-500">A 6-digit code is required to verify your first email.</p>
                            )}
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <label htmlFor="phone-no-input" className="block text-xs font-semibold text-stone-600">Mobile Contact Number</label>
                            <div className="relative">
                                <Smartphone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                <LoadingField loading={isLoading}><input
                                    id="phone-no-input"
                                    {...register("phone_no", {
                                        pattern: { value: /^(?:\+639|639|09)\d{9}$/, message: "Invalid Philippine mobile number format (e.g. 09171234567)" }
                                    })}
                                    placeholder="09..."
                                    className={`w-full h-10 pl-10 pr-3 bg-white border rounded-lg shadow-2xs text-sm text-stone-900 focus:outline-none focus:border-green-700 font-mono ${errors.phone_no ? 'border-red-400' : 'border-stone-200'}`}
                                /></LoadingField>
                            </div>
                            {errors.phone_no && <p className="text-xs text-red-500 font-medium">{errors.phone_no.message}</p>}
                        </div>
                    </div>
                </section>

                {/* Location: Farmers only */}
                {isFarmer && (
                    <section className="bg-white border border-stone-200 rounded-xl shadow-xs overflow-hidden">
                        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex items-center gap-3">
                            <div className="p-1.5 bg-green-50 border border-green-200 rounded-lg">
                                <MapPin size={16} className="text-green-700" />
                            </div>
                            <h2 className="text-xs font-bold text-stone-800 uppercase tracking-wide">Farm Location Details</h2>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="space-y-1.5">
                                <label htmlFor="barangay-select" className="block text-xs font-semibold text-stone-600">Registered Barangay</label>
                                <LoadingField loading={isLoading}><select
                                    id="barangay-select"
                                    {...register("barangay")}
                                    className="w-full h-10 px-3 bg-white border border-stone-200 rounded-lg shadow-2xs text-sm text-stone-800 focus:outline-none focus:border-green-700 appearance-none"
                                >
                                    <option value="">Select Barangay</option>
                                    {barangays?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select></LoadingField>
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="address-input" className="block text-xs font-semibold text-stone-600">Sitio / Street / Landmark</label>
                                <LoadingField loading={isLoading}><input
                                    id="address-input"
                                    {...register("address")}
                                    className="w-full h-10 px-3 bg-white border border-stone-200 rounded-lg shadow-2xs text-sm text-stone-900 focus:outline-none focus:border-green-700"
                                /></LoadingField>
                            </div>
                        </div>
                    </section>
                )}

                {/* Notifications: Farmers only */}
                {isFarmer && (
                    <section className="bg-white border border-stone-200 rounded-xl shadow-xs overflow-hidden">
                        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex items-center gap-3">
                            <div className="p-1.5 bg-green-50 border border-green-200 rounded-lg">
                                <Bell size={16} className="text-green-700" />
                            </div>
                            <h2 className="text-xs font-bold text-stone-800 uppercase tracking-wide">SMS Broadcast Notifications</h2>
                        </div>
                        <div className="px-6 py-5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-stone-800">SMS Status Alerts</p>
                                <p className="text-xs text-stone-500 mt-0.5">Receive instant SMS alerts when permits are reviewed, approved, or verified</p>
                            </div>
                            <LoadingField loading={isLoading}><input
                                type="checkbox"
                                {...register("receive_sms")}
                                className="checkbox checkbox-success rounded-md border-stone-300"
                            /></LoadingField>
                        </div>
                    </section>
                )}

                {/* Save Button */}
                <div className="flex justify-end pb-8">
                    <button
                        type="submit"
                        disabled={isLoading || isUpdating || isSendingCode}
                        className="btn-tactile bg-green-700 hover:bg-green-600 text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg shadow-xs transition-colors flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                        {isUpdating || isSendingCode ? (
                            <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving Profile...</>
                        ) : (
                            <><Save size={14} /> Save Profile Settings</>
                        )}
                    </button>
                </div>
            </form>
        );
    };

    return (
        <div className="min-h-full bg-stone-50/40">

            {/* Page Header */}
            <div className="bg-white border-b border-stone-200">
                <div className={`${PAGE_WIDTH} py-6`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                                    {authUser?.role || 'User'} Portal
                                </span>
                                <span className="text-stone-300">•</span>
                                <span className="text-xs text-stone-500">
                                    Settings & Administration
                                </span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight">
                                {canAccessSystemSettings ? "Settings Hub" : "Profile & Settings"}
                            </h1>
                            <p className="text-xs text-stone-600 font-normal mt-1 max-w-xl">
                                {canAccessSystemSettings
                                    ? "Manage personal account credentials and calibrate municipal regulatory permit configurations."
                                    : "Manage your personal contact information, location, and alert preferences."}
                            </p>
                        </div>

                        {/* Role Authority Badge */}
                        {canAccessSystemSettings && (
                            <div className="self-start sm:self-center flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-800 text-xs font-semibold">
                                <Building2 size={14} className="text-green-700" />
                                Authorized Municipal Officer
                            </div>
                        )}
                    </div>

                    {/* Role-Gated Segmented Tab Navigation */}
                    {canAccessSystemSettings && (
                        <div className="flex items-center gap-2 mt-6 border-b border-stone-200 -mb-6 overflow-x-auto">
                            {tabs.map(({ key, label, title, icon: Icon }) => (
                                <button
                                    key={key}
                                    type="button"
                                    title={title ?? label}
                                    onClick={() => handleTabChange(key)}
                                    className={`btn-tactile pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 whitespace-nowrap ${
                                        activeTab === key
                                            ? 'border-green-700 text-green-800 font-bold'
                                            : 'border-transparent text-stone-500 hover:text-stone-800'
                                    }`}
                                >
                                    <Icon size={15} />
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Page Content Body */}
            <div className={`${PAGE_WIDTH} py-8`}>
                {activeTab === 'system' ? (
                    /* TAB 2: Municipal Configuration (Authorized Only) */
                    <MunicipalSystemConfig />
                ) : activeTab === 'signatories' ? (
                    /* TAB 3: Signatory Roster (Authorized Only) */
                    <SignatoriesSection />
                ) : (
                    /* TAB 1: Personal Profile (All Users) */
                    renderProfileTab()
                )}
            </div>

            {pendingProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 animate-in fade-in duration-150" role="dialog" aria-modal="true" aria-labelledby="verify-email-title">
                    <form onSubmit={confirmEmail} className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 shadow-xl modal-enter">
                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-green-200 bg-green-50 text-green-700 animate-in zoom-in-75 duration-200">
                            <Mail size={20} />
                        </div>
                        <div className="view-enter">
                            <h2 id="verify-email-title" className="text-lg font-black text-stone-900">Verify your email</h2>
                            <p className="mt-1 text-xs text-stone-600">Enter the 6-digit code sent to <span className="font-semibold">{pendingProfile.email}</span>. It expires in 10 minutes.</p>
                        </div>
                        <label htmlFor="email-code" className="mt-5 block text-[10px] font-black uppercase tracking-widest text-stone-600">Verification Code</label>
                        <input
                            id="email-code"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            autoFocus
                            required
                            maxLength={6}
                            pattern="[0-9]{6}"
                            value={verificationCode}
                            onChange={(event) => {
                                setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                                setVerificationError('');
                            }}
                            className={`mt-1 h-12 w-full rounded-lg border text-center font-mono text-xl font-bold tracking-[0.4em] text-stone-900 outline-none transition-all duration-150 focus:border-green-700 focus:ring-2 focus:ring-green-100 ${verificationCode.length === 6 ? 'border-green-500 bg-green-50/40' : 'border-stone-200'}`}
                        />
                        {verificationError && <p className="mt-2 text-xs font-medium text-red-600 animate-in fade-in slide-in-from-top-1 duration-150">{verificationError}</p>}
                        <button type="submit" disabled={isVerifyingCode || verificationCode.length !== 6} className="btn-tactile mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-green-600 disabled:opacity-50">
                            {isVerifyingCode && <Loader2 size={15} className="animate-spin" />}
                            {isVerifyingCode ? 'Verifying...' : 'Verify Email'}
                        </button>
                        <div className="mt-3 flex items-center justify-between gap-3">
                            <button type="button" onClick={() => setPendingProfile(null)} className="btn-tactile text-xs font-semibold text-stone-600 hover:text-stone-900">Cancel</button>
                            <button type="button" disabled={isSendingCode || resendCooldown > 0} onClick={() => sendVerificationCode(pendingProfile.email)} className="btn-tactile text-xs font-bold text-green-700 transition-colors disabled:text-stone-400">
                                {resendCooldown > 0 ? `Send again in ${resendCooldown}s` : 'Send code again'}
                            </button>
                        </div>
                        {resendCooldown > 0 && (
                            <div className="mt-3 h-1 overflow-hidden rounded-full bg-stone-100" aria-hidden="true">
                                <div className="h-full rounded-full bg-green-600 transition-[width] duration-1000 ease-linear" style={{ width: `${(resendCooldown / 60) * 100}%` }} />
                            </div>
                        )}
                    </form>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
