import { useQueryClient, useMutation, useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "../lib/api";

export const useGetMaps = () => {
    return useQuery({
        queryKey: ['map'],
        queryFn: async () => {
            const res = await api.get('/barangay/')
            return res.data
        },
        staleTime: 1000 * 60 * 5, // treat data as fresh for 5 mins

    })
}


export const useGetHogSurvey = (year, quarter) => {
    return useQuery({
        queryKey: ['hog-survey', year, quarter],
        queryFn: async () => {
            const res = await api.get('/hog-survey/survey_data/', { params: { year, quarter } });
            return res.data;
        },
        placeholderData: keepPreviousData,
        enabled: Boolean(year && quarter),
        staleTime: 1000 * 60 * 5, // treat data as fresh for 5 mins
    })
}

export const useGetHogSurveyPeriods = () => {
    return useQuery({
        queryKey: ['hog-survey-periods'],
        queryFn: async () => {
            const res = await api.get('/hog-survey/periods/');
            return res.data;
        },
        staleTime: 1000 * 60 * 60,
    })
}

export const useGetTransportVolume = (year, quarter) => {
    return useQuery({
        queryKey: ['transport-volume', year, quarter],
        queryFn: async () => {
            const res = await api.get('/barangay/transport_volume/', { params: { year, quarter } });
            return res.data;
        },
        enabled: Boolean(year && quarter),
        staleTime: 1000 * 60 * 5,
    })
}

export const useGetCheckpoints = () => {
    return useQuery({
        queryKey: ['checkpoints'],
        queryFn: async () => {
            const res = await api.get('/checkpoints/');
            return res.data;
        },
        staleTime: 1000 * 60 * 5,
    })
}

export const useUploadHogSurvey = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.post('/hog-survey/upload_csv/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hog-survey'] });
            queryClient.invalidateQueries({ queryKey: ['hog-survey-years'] });
            queryClient.invalidateQueries({ queryKey: ['hog-survey-periods'] });
            queryClient.invalidateQueries({ queryKey: ['barangay-census-history'] });
            queryClient.invalidateQueries({ queryKey: ['barangay-density-data'] });
            queryClient.invalidateQueries({ queryKey: ['agri_metrics'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard_insights'] });
            queryClient.invalidateQueries({ queryKey: ['farmer-roster'] });
            queryClient.invalidateQueries({ queryKey: ['barangay-hog-surveys'] });
            queryClient.invalidateQueries({ queryKey: ['barangay-surveys-recent'] });
        },
    });
}
