import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
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
import { Camera, X, CheckCircle, AlertTriangle, MapPin } from "lucide-react";
import { GoogleVisionService as ImageVerificationService } from "@/services/googleVisionService";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { logger } from '@/lib/logger';
import { supabase } from "@/integrations/supabase/client";

// Google Maps imports
import { Loader } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_API_KEY } from '@/config/constants';

// Constants for validation
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_IMAGES = 5;
const MAX_ISSUES_PER_HOUR = 5;

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }).max(200, {
    message: "Title must be less than 200 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }).max(2000, {
    message: "Description must be less than 2000 characters.",
  }),
  category: z.enum(['road_damage', 'sanitation', 'lighting', 'graffiti', 'sidewalk', 'vegetation', 'other']),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }),
  photos: z.array(z.string()).max(MAX_IMAGES, {
    message: `You can upload a maximum of ${MAX_IMAGES} photos.`,
  }).optional(),
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
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoVerifications, setPhotoVerifications] = useState<{[key: number]: {isValid: boolean; confidence: number; reason?: string}}>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifierReady, setVerifierReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocomplete = useRef<any>(null);
  const [showLocationConfirm, setShowLocationConfirm] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{latitude: number; longitude: number} | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

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
      photos: [],
      isPublic: true,
    },
    mode: "onChange",
  });

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const description = form.getValues('description');
    const category = form.getValues('category');

    if (!description || description.length < 10) {
      toast({
        variant: "destructive",
        title: "Description Required",
        description: "Please provide a detailed description before uploading photos for verification.",
      });
      return;
    }

    // Check if we've reached max photos
    if (photos.length >= MAX_IMAGES) {
      toast({
        variant: "destructive",
        title: "Maximum Photos Reached",
        description: `You can only upload up to ${MAX_IMAGES} photos per issue.`,
      });
      return;
    }

    // Validate file sizes
    const oversizedFiles = Array.from(files).filter(file => file.size > MAX_IMAGE_SIZE);
    if (oversizedFiles.length > 0) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: `Each image must be less than 5MB. ${oversizedFiles.length} file(s) exceeded this limit.`,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const newPhotos = Array.from(files).slice(0, MAX_IMAGES - photos.length);
    setIsVerifying(true);
    
    for (let i = 0; i < newPhotos.length; i++) {
      const file = newPhotos[i];
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        const photoIndex = photos.length + i;
        
        try {
          // Verify the image matches the description
          const verification = await ImageVerificationService.verifyImage(
            result, 
            description, 
            category
          );
          
          setPhotoVerifications(prev => ({
            ...prev,
            [photoIndex]: verification
          }));

          if (verification.isValid) {
            setPhotos(prev => {
              const updated = [...prev, result].slice(0, MAX_IMAGES);
              form.setValue('photos', updated);
              return updated;
            });
            
            toast({
              title: "Image Verified",
              description: verification.reason || `Image verified with ${verification.confidence}% confidence`,
            });
          } else {
            // Remove and prompt re-upload
            if (fileInputRef.current) fileInputRef.current.value = "";
            toast({
              variant: "destructive",
              title: "Irrelevant image detected",
              description: verification.reason || "The uploaded image does not match your issue description.",
              action: (
                <ToastAction altText="Re-upload" onClick={() => fileInputRef.current?.click()}>
                  Re-upload
                </ToastAction>
              ),
            });
            // Auto-open after a moment to guide the user
            setTimeout(() => fileInputRef.current?.click(), 600);
          }
        } catch (error) {
          logger.error('Verification error:', error);
          // Block upload on error and prompt re-upload
          if (fileInputRef.current) fileInputRef.current.value = "";
          toast({
            variant: "destructive",
            title: "Verification unavailable",
            description: "Could not verify the image. Please try uploading again.",
            action: (
              <ToastAction altText="Re-upload" onClick={() => fileInputRef.current?.click()}>
                Re-upload
              </ToastAction>
            ),
          });
          setTimeout(() => fileInputRef.current?.click(), 600);
        }
        
        if (i === newPhotos.length - 1) {
          setIsVerifying(false);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const updated = prev.filter((_, i) => i !== index);
      form.setValue('photos', updated);
      return updated;
    });
    
    setPhotoVerifications(prev => {
      const updated = { ...prev };
      delete updated[index];
      // Reindex remaining verifications
      const reindexed: typeof updated = {};
      Object.keys(updated).forEach(key => {
        const oldIndex = parseInt(key);
        if (oldIndex > index) {
          reindexed[oldIndex - 1] = updated[oldIndex];
        } else if (oldIndex < index) {
          reindexed[oldIndex] = updated[oldIndex];
        }
      });
      return reindexed;
    });
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Geolocation Not Supported",
        description: "Your browser does not support geolocation.",
      });
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setShowLocationConfirm(true);
        setIsLoadingLocation(false);
      },
      (error) => {
        setIsLoadingLocation(false);
        toast({
          variant: "destructive",
          title: "Location Access Denied",
          description: "Please enable location permissions to use this feature.",
        });
      }
    );
  };

  const confirmUseCurrentLocation = async () => {
    if (!currentPosition || !map.current) return;

    const { latitude, longitude } = currentPosition;
    
    setLocation({ latitude, longitude });
    form.setValue('location.latitude', latitude);
    form.setValue('location.longitude', longitude);
    form.setValue('location.address', 'Current Location');

    map.current.panTo({ lat: latitude, lng: longitude });
    map.current.setZoom(16);

    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY!,
      version: "weekly",
      libraries: ["marker"]
    });

    const { AdvancedMarkerElement } = await loader.importLibrary("marker") as any;

    if (map.current.currentMarker) {
      map.current.currentMarker.setMap(null);
    }

    map.current.currentMarker = new AdvancedMarkerElement({
      map: map.current,
      position: { lat: latitude, lng: longitude },
      title: "Current Location"
    });

    setShowLocationConfirm(false);
    toast({
      title: "Location Set",
      description: "Your current location has been set as the issue location.",
    });
  };

  useEffect(() => {
    const initializeMap = async () => {
      if (!GOOGLE_MAPS_API_KEY || !mapContainer.current) return;
      
      try {
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: "weekly",
          libraries: ["places", "geometry"]
        });

        const { Map } = await loader.importLibrary("maps") as any;
        const { AdvancedMarkerElement } = await loader.importLibrary("marker") as any;
        const { Autocomplete } = await loader.importLibrary("places") as any;

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

        // Initialize Places Autocomplete
        if (searchInputRef.current) {
          autocomplete.current = new Autocomplete(searchInputRef.current, {
            types: ['geocode'],
            fields: ['place_id', 'geometry', 'name', 'formatted_address']
          });

          autocomplete.current.addListener('place_changed', () => {
            const place = autocomplete.current.getPlace();
            
            if (place.geometry && place.geometry.location) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              
              const newLocation = {
                latitude: lat,
                longitude: lng,
                address: place.formatted_address || place.name || 'Selected Location'
              };
              
              setLocation(newLocation);
              form.setValue('location.latitude', lat);
              form.setValue('location.longitude', lng);
              form.setValue('location.address', newLocation.address);

              // Update map center and marker
              map.current.panTo({ lat, lng });
              map.current.setZoom(15);

              // Clear existing marker and add new one
              if (map.current.currentMarker) {
                map.current.currentMarker.setMap(null);
              }

              map.current.currentMarker = new AdvancedMarkerElement({
                map: map.current,
                position: { lat, lng },
                title: newLocation.address
              });
            }
          });
        }

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
        logger.error('Error initializing Google Maps:', error);
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
      if (defaultValues && map.current && mapLoaded && GOOGLE_MAPS_API_KEY) {
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

      // Check email verification for new issues
      if (!issueId && !user.emailVerified) {
        toast({
          variant: "destructive",
          title: "Email Verification Required",
          description: "Please verify your email address before reporting issues.",
        });
        setIsSubmitting(false);
        return;
      }

      // Rate limiting check for new issues only (not edits)
      if (!issueId) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count, error: countError } = await supabase
          .from('issues')
          .select('*', { count: 'exact', head: true })
          .eq('reporter_id', user.id)
          .gte('created_at', oneHourAgo);

        if (countError) {
          logger.error('Error checking rate limit:', countError);
        } else if (count && count >= MAX_ISSUES_PER_HOUR) {
          toast({
            variant: "destructive",
            title: "Rate Limit Exceeded",
            description: `You can only report ${MAX_ISSUES_PER_HOUR} issues per hour. Please try again later.`,
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Ensure all required fields are present for addIssue
      const issueData = {
        title: values.title,
        description: values.description,
        category: values.category,
        reporterId: user.id,
        reporterName: user.name || 'Anonymous',
        reporterEmail: user.email,
        status: 'open' as IssueStatus,
        location: {
          latitude: values.location.latitude,
          longitude: values.location.longitude,
          address: values.location.address || 'No address provided',
        },
        photos: photos,
        isPublic: values.isPublic,
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
      logger.error("Error submitting issue:", error);
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

            {/* Map Location Selection */}
            <div className="w-full">
              <Label>Select Location on Map</Label>
              
              {/* Location Search Input */}
              <div className="mb-4 space-y-2">
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for a location..."
                  className="w-full"
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Type a location name or address, then click on the map to fine-tune
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUseMyLocation}
                    disabled={isLoadingLocation}
                    className="flex items-center gap-2 shrink-0"
                  >
                    <MapPin className="h-4 w-4" />
                    {isLoadingLocation ? "Getting Location..." : "Use My Location"}
                  </Button>
                </div>
              </div>
              
              <div ref={mapContainer} className="h-64 rounded border" />
            </div>

            {/* Photo Upload Section */}
            <div>
              <Label>Photos (Optional - Max 5, 5MB each)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Photos will be automatically verified against your description to ensure relevance.
              </p>
              <div className="mt-2">
                {photos.length < MAX_IMAGES && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors",
                      isVerifying && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Camera className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {isVerifying 
                        ? "Verifying images..." 
                        : `Click to upload photos (${photos.length}/${MAX_IMAGES})`
                      }
                    </p>
                  </div>
                )}
                
                {photos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo}
                          alt={`Issue photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        
                        {/* Verification Status Badge */}
                        {photoVerifications[index] && (
                          <div className={cn(
                            "absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                            photoVerifications[index].isValid
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-red-100 text-red-800 border border-red-200"
                          )}>
                            {photoVerifications[index].isValid ? (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                Verified
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="h-3 w-3" />
                                Failed
                              </>
                            )}
                          </div>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        
                        {/* Verification Details Tooltip */}
                        {photoVerifications[index] && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-xs p-2 rounded-b-lg">
                            {photoVerifications[index].reason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
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

            <Button type="submit" disabled={isSubmitting || isVerifying}>
              {isSubmitting ? "Submitting..." : isVerifying ? "Verifying Images..." : "Submit"}
            </Button>
          </form>
        </Form>
      </CardContent>

      {/* Location Confirmation Dialog */}
      <AlertDialog open={showLocationConfirm} onOpenChange={setShowLocationConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Use Current Location?</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to set your current location as the location of this issue?
              {currentPosition && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Coordinates: {currentPosition.latitude.toFixed(6)}, {currentPosition.longitude.toFixed(6)}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUseCurrentLocation}>
              Yes, Use This Location
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default IssueForm;
