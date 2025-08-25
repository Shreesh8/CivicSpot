import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { IssueCategory, IssueStatus } from '@/contexts/IssueContext';
import { useIssues } from '@/contexts/IssueContext';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Google Maps imports
import { Loader } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_API_KEY } from '@/config/constants';

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  category: z.enum(['road_damage', 'sanitation', 'lighting', 'graffiti', 'sidewalk', 'vegetation', 'other']),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }),
  photos: z.array(z.string()).optional(),
  isPublic: z.boolean().default(true),
});

interface IssueFormProps {
  issueId?: string;
  defaultValues?: z.infer<typeof formSchema>;
  onSubmit?: (values: z.infer<typeof formSchema>) => void;
  onSubmitSuccess?: () => void;
}

const IssueForm: React.FC<IssueFormProps> = ({ issueId, defaultValues, onSubmit, onSubmitSuccess }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addIssue, updateIssue, getIssue } = useIssues();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      title: '',
      description: '',
      category: 'road_damage',
      location: {
        latitude: 0,
        longitude: 0,
      },
      isPublic: true,
    },
    mode: "onChange",
  });

  useEffect(() => {
    const initializeMap = async () => {
      if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE' || !mapContainer.current) return;
      
      try {
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: "weekly",
          libraries: ["places", "geometry"]
        });

        const { Map } = await loader.importLibrary("maps") as any;
        const { AdvancedMarkerElement } = await loader.importLibrary("marker") as any;

        // Default to Ayodhya coordinates
        const center = { lat: 26.7922, lng: 82.1998 };

        map.current = new Map(mapContainer.current, {
          center: center,
          zoom: 13,
          mapId: "DEMO_MAP_ID",
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        setMapLoaded(true);

        // Add click listener to select location
        map.current.addListener('click', (e: any) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          
          const newLocation = {
            latitude: lat,
            longitude: lng,
          };
          
          setLocation(newLocation);
          form.setValue('location.latitude', lat);
          form.setValue('location.longitude', lng);

          // Clear existing markers and add new one
          if (map.current.currentMarker) {
            map.current.currentMarker.setMap(null);
          }

          map.current.currentMarker = new AdvancedMarkerElement({
            map: map.current,
            position: { lat, lng },
            title: "Selected Location"
          });
        });

      } catch (error) {
        console.error('Error initializing Google Maps:', error);
      }
    };

    initializeMap();

    return () => {
      if (map.current?.currentMarker) {
        map.current.currentMarker.setMap(null);
      }
    };
  }, [form]);

  useEffect(() => {
    const updateMapLocation = async () => {
      if (defaultValues && map.current && mapLoaded && GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        const { latitude, longitude } = defaultValues.location;
        setLocation({ latitude, longitude });

        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: "weekly",
          libraries: ["marker"]
        });

        const { AdvancedMarkerElement } = await loader.importLibrary("marker") as any;

        // Clear existing marker
        if (map.current.currentMarker) {
          map.current.currentMarker.setMap(null);
        }

        // Pan to the location and add a marker
        map.current.panTo({ lat: latitude, lng: longitude });
        map.current.setZoom(15);

        map.current.currentMarker = new AdvancedMarkerElement({
          map: map.current,
          position: { lat: latitude, lng: longitude },
          title: "Issue Location"
        });
      }
    };

    updateMapLocation();
  }, [defaultValues, mapLoaded]);

  async function onSubmitHandler(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      if (!user) {
        throw new Error('User must be logged in to submit an issue.');
      }

      // Ensure all required fields are present for addIssue
      const issueData = {
        title: values.title,
        description: values.description,
        category: values.category, // This is now non-optional as required by the form schema
        reporterId: user.id,
        reporterName: user.name || 'Anonymous',
        status: 'open' as IssueStatus,
        location: {
          latitude: values.location.latitude,
          longitude: values.location.longitude,
          address: values.location.address || 'No address provided',
        },
        photos: values.photos || [], // Ensure photos is always an array
      };

      if (issueId) {
        // Update existing issue
        await updateIssue(issueId, issueData);
        toast({
          title: "Issue Updated",
          description: "Your issue has been updated successfully.",
        });
      } else {
        // Create new issue
        await addIssue(issueData);
        toast({
          title: "Issue Reported",
          description: "Your issue has been reported successfully.",
        });
      }

      if (onSubmit) {
        onSubmit(values);
      }

      if (onSubmitSuccess) {
        onSubmitSuccess();
      } else {
        navigate('/');
      }
    } catch (error: any) {
      console.error("Error submitting issue:", error);
      toast({
        variant: "destructive",
        title: "Error Reporting Issue",
        description: error.message || "Failed to report the issue. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{issueId ? "Edit Issue" : "Report an Issue"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitHandler)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="A brief title for the issue" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the issue in detail"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="road_damage">Road Damage</SelectItem>
                      <SelectItem value="sanitation">Sanitation</SelectItem>
                      <SelectItem value="lighting">Lighting</SelectItem>
                      <SelectItem value="graffiti">Graffiti</SelectItem>
                      <SelectItem value="sidewalk">Sidewalk</SelectItem>
                      <SelectItem value="vegetation">Vegetation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location Section */}
            <div>
              <Label>Location</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location.latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Latitude"
                          type="number"
                          {...field}
                          value={location?.latitude !== undefined ? location.latitude.toString() : ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setLocation(prev => ({ ...prev, latitude: value }));
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location.longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Longitude"
                          type="number"
                          {...field}
                          value={location?.longitude !== undefined ? location.longitude.toString() : ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setLocation(prev => ({ ...prev, longitude: value }));
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Map Preview */}
            <div className="w-full">
              <Label>Select Location on Map</Label>
              {(!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    Please add your Google Maps API key to <code className="bg-gray-100 px-1 rounded">src/config/constants.ts</code> to enable map functionality.
                  </p>
                  <p className="text-xs text-gray-500">
                    Get your key from <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a>
                  </p>
                </div>
              )}
              <div ref={mapContainer} className="h-64 rounded border" />
            </div>

            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Public Report</FormLabel>
                    <FormDescription>
                      Do you want this report to be public?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default IssueForm;
