<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Project;
use App\Models\SCurveMetric;
use App\Models\ProjectSchedule;
use App\Models\ProjectDocument;
use App\Models\NextWeekPlan;
use App\Models\ProgressPhoto;
use App\Models\ProjectAttachment;
use App\Models\SubcontractorPackage;

class NotificationController extends Controller
{
    /**
     * Endpoint API: Pusat Informasi & Pengingat Kelengkapan Section Proyek
     * GET /api/notifications/general
     */
    public function general(Request $request): JsonResponse
    {
        $projects = Project::orderBy('id', 'asc')->get();
        $notifications = [];

        foreach ($projects as $project) {
            $pId = $project->id;
            $pName = $project->project_name;
            $pCode = $project->project_code ?: 'EEES';

            // 1. Cek Data S-Curve / Import Excel
            $scurveCount = SCurveMetric::where('project_id', $pId)->count();
            if ($scurveCount === 0) {
                $notifications[] = [
                    'id' => "empty_scurve_{$pId}",
                    'project_id' => $pId,
                    'project_name' => $pName,
                    'project_code' => $pCode,
                    'section_key' => 'scurve',
                    'type' => 'warning',
                    'title' => 'Data S-Curve Belum Diimpor',
                    'message' => "Proyek {$pName} belum memiliki data kurva S-Curve.",
                    'action_label' => 'Import Excel / S-Curve',
                    'created_at' => $project->updated_at?->toISOString() ?? now()->toISOString(),
                ];
            }

            // 2. Cek Schedule / Input Bobot WBS
            $scheduleCount = ProjectSchedule::where('project_id', $pId)->count();
            if ($scheduleCount === 0) {
                $notifications[] = [
                    'id' => "empty_schedule_{$pId}",
                    'project_id' => $pId,
                    'project_name' => $pName,
                    'project_code' => $pCode,
                    'section_key' => 'scurve',
                    'type' => 'warning',
                    'title' => 'Schedule WBS Belum Diisi',
                    'message' => "Daftar item pekerjaan & bobot Schedule belum terdaftar.",
                    'action_label' => 'Buka Sub-Tab Schedule',
                    'created_at' => $project->updated_at?->toISOString() ?? now()->toISOString(),
                ];
            }

            // 3. Cek Project Notes & Risk
            $hasNotes = ProjectDocument::where('project_id', $pId)
                ->whereNotNull('content')
                ->where('content', '!=', '')
                ->where('content', '!=', '<p></p>')
                ->exists();
            if (!$hasNotes) {
                $notifications[] = [
                    'id' => "empty_notes_{$pId}",
                    'project_id' => $pId,
                    'project_name' => $pName,
                    'project_code' => $pCode,
                    'section_key' => 'reportnotes',
                    'type' => 'warning',
                    'title' => 'Project Notes & Risk Kosong',
                    'message' => "Lembar Area of Concern & Risk Register belum diisi.",
                    'action_label' => 'Isi Notes & Risk',
                    'created_at' => $project->updated_at?->toISOString() ?? now()->toISOString(),
                ];
            }

            // 4. Cek Next Week Plan (To-Do List)
            $todoCount = NextWeekPlan::where('project_id', $pId)->count();
            if ($todoCount === 0) {
                $notifications[] = [
                    'id' => "empty_nextweek_{$pId}",
                    'project_id' => $pId,
                    'project_name' => $pName,
                    'project_code' => $pCode,
                    'section_key' => 'nextweek',
                    'type' => 'warning',
                    'title' => 'Next Week Plan Belum Diisi',
                    'message' => "Checklist rencana kerja minggu depan belum ada to-do item.",
                    'action_label' => 'Buka Next Week Plan',
                    'created_at' => $project->updated_at?->toISOString() ?? now()->toISOString(),
                ];
            }

            // 5. Cek Dokumentasi Foto Lapangan
            $photoCount = ProgressPhoto::where('project_id', $pId)->count();
            if ($photoCount === 0) {
                $notifications[] = [
                    'id' => "empty_photos_{$pId}",
                    'project_id' => $pId,
                    'project_name' => $pName,
                    'project_code' => $pCode,
                    'section_key' => 'thisweek',
                    'type' => 'warning',
                    'title' => 'Dokumentasi Foto Belum Ada',
                    'message' => "Belum ada unggahan foto progres fisik lapangan.",
                    'action_label' => 'Upload Dokumentasi Foto',
                    'created_at' => $project->updated_at?->toISOString() ?? now()->toISOString(),
                ];
            }

            // 6. Cek Lampiran Dokumen PDF (project_attachments)
            $attachmentCount = ProjectAttachment::where('project_id', $pId)->count();
            if ($attachmentCount === 0) {
                $notifications[] = [
                    'id' => "empty_attachments_{$pId}",
                    'project_id' => $pId,
                    'project_name' => $pName,
                    'project_code' => $pCode,
                    'section_key' => 'reportnotes',
                    'type' => 'warning',
                    'title' => 'Lampiran Dokumen PDF Kosong',
                    'message' => "Arsip file Weekly Report / Kontrak / SPK PDF belum diunggah.",
                    'action_label' => 'Buka Lampiran PDF',
                    'created_at' => $project->updated_at?->toISOString() ?? now()->toISOString(),
                ];
            }

            // 7. Cek Subcontractor / Package Status
            $packageCount = SubcontractorPackage::where('project_id', $pId)->count();
            if ($packageCount === 0) {
                $notifications[] = [
                    'id' => "empty_packages_{$pId}",
                    'project_id' => $pId,
                    'project_name' => $pName,
                    'project_code' => $pCode,
                    'section_key' => 'detail',
                    'type' => 'warning',
                    'title' => 'Work Packages Belum Diisi',
                    'message' => "Daftar paket pekerjaan subkontraktor belum tercatat.",
                    'action_label' => 'Buka Progress Detail',
                    'created_at' => $project->updated_at?->toISOString() ?? now()->toISOString(),
                ];
            }

            // 8. Info General: Behind Schedule / Variance Negatif
            $dev = (float) $project->deviation;
            $planCum = (float) $project->plan_cumulative;
            $actCum = (float) $project->actual_cumulative;
            $isBehind = ($dev < -0.01) || ($actCum < $planCum && $planCum > 0);

            if ($isBehind) {
                $varFormatted = $dev < 0 ? number_format($dev, 2) . '%' : '-' . number_format($planCum - $actCum, 2) . '%';
                $notifications[] = [
                    'id' => "behind_schedule_{$pId}",
                    'project_id' => $pId,
                    'project_name' => $pName,
                    'project_code' => $pCode,
                    'section_key' => 'overview',
                    'type' => 'info',
                    'title' => 'Status: Behind Schedule',
                    'message' => "Progres aktual tertinggal ({$varFormatted}) dari target rencana.",
                    'action_label' => 'Lihat Analisis Overview',
                    'created_at' => $project->updated_at?->toISOString() ?? now()->toISOString(),
                ];
            }
        }

        // Hitung total dan breakdown
        $warningCount = count(array_filter($notifications, fn($n) => $n['type'] === 'warning'));
        $infoCount = count(array_filter($notifications, fn($n) => $n['type'] === 'info'));

        return response()->json([
            'success' => true,
            'count' => count($notifications),
            'warning_count' => $warningCount,
            'info_count' => $infoCount,
            'notifications' => $notifications,
            'summary' => [
                'total_projects' => $projects->count(),
                'incomplete_sections' => $warningCount,
            ],
        ]);
    }
}
