import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../../components/admin/AdminLayout';
import { adminApi } from '../../../../services/adminApi';
import type { MoodleCourse } from '../../../../types';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Label } from '../../../../components/ui/Label';
import { Select, SelectItem } from '../../../../components/ui/Select';

interface Props {
  navigateTo: (view: 'adminMoodlePackages') => void;
}

export const MoodlePackageUploadPage: React.FC<Props> = ({ navigateTo }) => {
    const [courses, setCourses] = useState<MoodleCourse[]>([]);
    const [courseId, setCourseId] = useState("");
    const [file, setFile] = useState<File|null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        adminApi.listMoodleCourses().then(res => setCourses(res.items));
    }, []);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!file || !courseId) return alert("Course & File are required");
        setIsLoading(true);
        try {
            await adminApi.uploadMoodlePackage(courseId, file);
            alert("Package uploaded successfully (simulation)!");
            navigateTo('adminMoodlePackages');
        } catch (error) {
            alert("Upload failed.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AdminLayout currentView="adminMoodlePackages" navigateTo={navigateTo as any}>
            <div className="container py-6 max-w-lg">
                <h1 className="text-xl font-semibold mb-4">Uploader package SCORM/H5P</h1>
                <form onSubmit={onSubmit} className="space-y-4 bg-card p-6 rounded-2xl border">
                    <div>
                        <Label>Course</Label>
                        <Select onValueChange={setCourseId} value={courseId}>
                            <option value="">Select Course</option>
                            {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.fullname}</SelectItem>)}
                        </Select>
                    </div>
                    <div>
                        <Label>Package File (.zip or .h5p)</Label>
                        <Input type="file" accept=".zip,.h5p" onChange={e => setFile(e.target.files?.[0] || null)} />
                    </div>
                    <Button type="submit" disabled={isLoading}>{isLoading ? 'Uploading...' : 'Upload'}</Button>
                </form>
            </div>
        </AdminLayout>
    );
};
