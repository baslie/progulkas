"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import Image from "next/image";

import type { AuthorCandidate } from "@/lib/admin/users";
import {
  ROUTE_AUDIENCES,
  ROUTE_DIFFICULTIES,
  ROUTE_STATUSES,
  getAudienceLabel,
  getDifficultyLabel,
  getStatusLabel,
} from "@/lib/routes/constants";
import { routeEditorSchema } from "@/lib/admin/routes";
import type { RouteEditorData, RouteEditorInput } from "@/lib/admin/routes";
import type { RouteDetails } from "@/lib/routes/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RouteDescription } from "@/components/routes/route-description";
import type { TrackConversionStats } from "@/lib/routes/track-import";
import { formatDistance, formatDuration } from "@/lib/utils";

const poiCategories = [
  { value: "viewpoint", label: "Смотровая точка" },
  { value: "food", label: "Еда и кофе" },
  { value: "water", label: "Вода" },
  { value: "transport", label: "Транспорт" },
  { value: "warning", label: "Предупреждение" },
  { value: "info", label: "Полезная точка" },
] as const;

type FormValues = RouteEditorInput;
type ResolvedFormValues = RouteEditorData;

type RouteEditorFormProps = {
  authors: AuthorCandidate[];
  currentUserId: string;
  canPublish: boolean;
  initialRoute?: (RouteDetails & {
    trackGeoJson: RouteDetails["trackGeoJson"];
    pointsOfInterest: RouteDetails["pointsOfInterest"];
    galleryImageUrls: string[];
  }) & {
    id: string;
  };
};

type ApiError = { error?: string };

type ApiRouteResponse = { route: { id: string; slug: string } };

type PhotoResponse = {
  image: {
    dataUrl: string;
    width: number;
    height: number;
    size: number;
  };
};

type PreviewResponse = {
  preview: {
    dataUrl: string;
    width: number;
    height: number;
    size: number;
  };
};

type TrackResponse = {
  track: FormValues["trackGeoJson"];
  stats: TrackConversionStats;
};

function arrayToTextarea(value: string[]): string {
  return value.join("\n");
}

function textareaToArray(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter((item, index, array) => item.length > 0 && array.indexOf(item) === index);
}

function round(number: number | null | undefined, digits = 2) {
  if (!number && number !== 0) {
    return "—";
  }

  return Number(number).toFixed(digits);
}

export function RouteEditorForm({ authors, currentUserId, canPublish, initialRoute }: RouteEditorFormProps) {
  const defaultAuthors = useMemo(() => {
    if (initialRoute) {
      return initialRoute.authors.map((author) => author.id);
    }

    if (authors.some((author) => author.id === currentUserId)) {
      return [currentUserId];
    }

    const first = authors[0]?.id ? [authors[0].id] : [];
    return first;
  }, [authors, currentUserId, initialRoute]);

  const form = useForm<FormValues, unknown, ResolvedFormValues>({
    resolver: zodResolver(routeEditorSchema),
    defaultValues: initialRoute
      ? {
          title: initialRoute.title,
          summary: initialRoute.summary,
          city: initialRoute.city,
          region: initialRoute.region,
          difficulty: initialRoute.difficulty,
          distanceKm: initialRoute.distanceKm,
          durationMinutes: initialRoute.durationMinutes,
          suitableFor: initialRoute.suitableFor,
          tags: initialRoute.tags,
          highlights: initialRoute.highlights,
          descriptionMarkdown: initialRoute.descriptionMarkdown,
          howToGet: initialRoute.howToGet ?? "",
          howToReturn: initialRoute.howToReturn ?? "",
          safetyNotes: initialRoute.safetyNotes ?? "",
          interestingFacts: initialRoute.interestingFacts,
          trackGeoJson: initialRoute.trackGeoJson as FormValues["trackGeoJson"],
          trackSourceFormat: initialRoute.trackSourceFormat ?? null,
          trackSourceFilename: initialRoute.trackSourceFilename ?? null,
          pointsOfInterest: (initialRoute.pointsOfInterest ?? []) as FormValues["pointsOfInterest"],
          coverImageUrl: initialRoute.coverImageUrl ?? null,
          previewImageUrl: initialRoute.previewImageUrl ?? null,
          galleryImageUrls: initialRoute.galleryImageUrls ?? [],
          status: initialRoute.status,
          authors: defaultAuthors,
        }
      : {
          title: "",
          summary: "",
          city: "Томск",
          region: "Томская область",
          difficulty: ROUTE_DIFFICULTIES[1]?.value ?? "MODERATE",
          distanceKm: 5,
          durationMinutes: 120,
          suitableFor: [ROUTE_AUDIENCES[0]?.value ?? "WALK"],
          tags: [],
          highlights: [],
          descriptionMarkdown: "",
          howToGet: "",
          howToReturn: "",
          safetyNotes: "",
          interestingFacts: [],
          trackGeoJson: null,
          trackSourceFormat: null,
          trackSourceFilename: null,
          pointsOfInterest: [],
          coverImageUrl: null,
          previewImageUrl: null,
          galleryImageUrls: [],
          status: "DRAFT",
          authors: defaultAuthors,
        },
  });

  const [trackStats, setTrackStats] = useState<TrackConversionStats | null>(null);
  const [preview, setPreview] = useState<PreviewResponse["preview"] | null>(
    initialRoute && initialRoute.previewImageUrl
      ? {
          dataUrl: initialRoute.previewImageUrl,
          width: 1200,
          height: 630,
          size: 0,
        }
      : null,
  );
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isGeneratingPreview, startPreviewTransition] = useTransition();
  const [isSubmitting, startSubmitTransition] = useTransition();

  const poiArray = useFieldArray<FormValues, "pointsOfInterest">({
    control: form.control,
    name: "pointsOfInterest",
  });
  const values = form.watch();

  useEffect(() => {
    if (values.trackGeoJson) {
      startPreviewTransition(async () => {
        try {
          const response = await fetch("/api/admin/routes/preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              trackGeoJson: values.trackGeoJson,
              pointsOfInterest: values.pointsOfInterest,
            }),
          });

          if (!response.ok) {
            const error = (await response.json()) as ApiError;
            throw new Error(error.error ?? "Ошибка генерации превью");
          }

          const data = (await response.json()) as PreviewResponse;
          setPreview(data.preview);
          form.setValue("previewImageUrl", data.preview.dataUrl, { shouldDirty: true });
        } catch (error) {
          console.error(error);
        }
      });
    }
  }, [values.trackGeoJson, values.pointsOfInterest, form]);

  const handleTrackUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/tracks/convert", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = (await response.json()) as ApiError;
      throw new Error(error.error ?? "Не удалось обработать трек");
    }

    const data = (await response.json()) as TrackResponse;
    form.setValue("trackGeoJson", data.track, { shouldDirty: true });
    form.setValue("trackSourceFormat", file.name.split(".").pop()?.toUpperCase() ?? null, { shouldDirty: true });
    form.setValue("trackSourceFilename", file.name, { shouldDirty: true });
    setTrackStats(data.stats);
  };

  const handleCoverUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/photos/process", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = (await response.json()) as ApiError;
      throw new Error(error.error ?? "Не удалось обработать изображение");
    }

    const data = (await response.json()) as PhotoResponse;
    form.setValue("coverImageUrl", data.image.dataUrl, { shouldDirty: true });
    setPreview((prev) => prev ?? null);
  };

  const handleGalleryUpload = async (files: FileList) => {
    setGalleryError(null);
    const next = [...(values.galleryImageUrls ?? [])];

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/admin/photos/process", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = (await response.json()) as ApiError;
          throw new Error(error.error ?? `Не удалось обработать ${file.name}`);
        }

        const data = (await response.json()) as PhotoResponse;
        next.push(data.image.dataUrl);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Не удалось обработать фотографию";
        setGalleryError(message);
      }
    }

    form.setValue("galleryImageUrls", Array.from(new Set(next)), { shouldDirty: true });
  };

  const onSubmit = (submitStatus: ResolvedFormValues["status"]) => {
    setSubmitError(null);
    setSubmitSuccess(null);
    form.setValue("status", submitStatus, { shouldDirty: true });

    startSubmitTransition(() =>
      form.handleSubmit(async (data) => {
        try {
          const endpoint = initialRoute ? `/api/admin/routes/${initialRoute.id}` : "/api/admin/routes";
          const method = initialRoute ? "PATCH" : "POST";
          const response = await fetch(endpoint, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const error = (await response.json()) as ApiError;
            throw new Error(error.error ?? "Не удалось сохранить маршрут");
          }

          const payload = (await response.json()) as ApiRouteResponse;
          setSubmitSuccess(
            initialRoute
              ? `Маршрут обновлён (${payload.route.slug})`
              : `Маршрут сохранён. Черновик #${payload.route.id}`,
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Не удалось сохранить маршрут";
          setSubmitError(message);
        }
      })(),
    );
  };

  return (
    <Form {...form}>
      <form className="grid gap-8" onSubmit={(event) => event.preventDefault()}>
        <section className="grid gap-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input placeholder="Например, Кедровая тропа" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Краткое описание</FormLabel>
                  <FormControl>
                    <Input placeholder="Что делает маршрут особенным?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Город</FormLabel>
                  <FormControl>
                    <Input placeholder="Томск" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Регион</FormLabel>
                  <FormControl>
                    <Input placeholder="Томская область" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Сложность</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      {ROUTE_DIFFICULTIES.map((difficulty) => (
                        <option key={difficulty.value} value={difficulty.value}>
                          {difficulty.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormDescription>{getDifficultyLabel(field.value)}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="distanceKm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Длина, км</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={field.value ?? ""}
                      onChange={(event) => field.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Длительность, мин</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="15"
                      min="15"
                      value={field.value ?? ""}
                      onChange={(event) => field.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="suitableFor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Подходит для</FormLabel>
                <div className="flex flex-wrap gap-3 rounded-2xl border border-dashed border-border bg-background/80 p-4">
                  {ROUTE_AUDIENCES.map((audience) => {
                    const checked = field.value?.includes(audience.value);
                    return (
                      <label key={audience.value} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border"
                          checked={checked}
                          onChange={(event) => {
                            if (event.target.checked) {
                              field.onChange([...(field.value ?? []), audience.value]);
                            } else {
                              field.onChange((field.value ?? []).filter((item) => item !== audience.value));
                            }
                          }}
                        />
                        {getAudienceLabel(audience.value)}
                      </label>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="grid gap-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Теги</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Через перевод строки"
                      value={arrayToTextarea(field.value ?? [])}
                      onChange={(event) => field.onChange(textareaToArray(event.target.value))}
                    />
                  </FormControl>
                  <FormDescription>Используются для поиска</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="highlights"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Маршрут выделяется</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Комфортные тропы, вид на реку..."
                      value={arrayToTextarea(field.value ?? [])}
                      onChange={(event) => field.onChange(textareaToArray(event.target.value))}
                    />
                  </FormControl>
                  <FormDescription>Короткие тезисы для карточки</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="descriptionMarkdown"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Полное описание (Markdown)</FormLabel>
                <FormControl>
                  <Textarea className="min-h-[200px]" placeholder="Маршрут начинается..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="howToGet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Как добраться</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[120px]"
                      placeholder="Описание транспорта"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="howToReturn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Как вернуться</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[120px]"
                      placeholder="Обратно тем же автобусом..."
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="safetyNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Риски и предупреждения</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[120px]"
                      placeholder="Комары, крутые спуски..."
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="interestingFacts"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Интересные факты</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Каждый факт с новой строки"
                    value={arrayToTextarea(field.value ?? [])}
                    onChange={(event) => field.onChange(textareaToArray(event.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="grid gap-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Трек</h2>
            <p className="text-sm text-muted-foreground">
              Загружайте GPX, KML или GeoJSON. Файл будет автоматически конвертирован и сохранён в базе данных.
            </p>
            <input
              type="file"
              accept=".gpx,.kml,.geojson,.json"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  await handleTrackUpload(file);
                } catch (error) {
                  const message = error instanceof Error ? error.message : "Не удалось обработать трек";
                  setSubmitError(message);
                }
              }}
            />
            {trackStats ? (
              <div className="grid gap-2 rounded-2xl border border-dashed border-border bg-background/80 p-4 text-sm text-muted-foreground">
                <p>Сегменты: {trackStats.segmentCount}</p>
                <p>Точек: {trackStats.pointCount}</p>
                <p>Длина: {round(trackStats.lengthKm)} км</p>
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Обложка</h2>
            <p className="text-sm text-muted-foreground">
              Изображение будет оптимизировано до 1920px и 3 МБ. Поддерживаются JPG, PNG, WebP.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  await handleCoverUpload(file);
                } catch (error) {
                  const message = error instanceof Error ? error.message : "Не удалось обработать изображение";
                  setSubmitError(message);
                }
              }}
            />
            {values.coverImageUrl ? (
              <Image
                alt="Обложка маршрута"
                src={values.coverImageUrl}
                width={800}
                height={400}
                unoptimized
                className="h-48 w-full rounded-2xl border border-border object-cover"
              />
            ) : null}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Галерея</h2>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={async (event) => {
                const files = event.target.files;
                if (!files || files.length === 0) return;
                await handleGalleryUpload(files);
              }}
            />
            {galleryError ? <p className="text-sm text-destructive">{galleryError}</p> : null}
            {(values.galleryImageUrls?.length ?? 0) ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {(values.galleryImageUrls ?? []).map((url) => (
                  <Image
                    key={url}
                    src={url}
                    alt="Галерея"
                    width={400}
                    height={300}
                    unoptimized
                    className="h-32 w-full rounded-xl object-cover"
                  />
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Точки интереса</h2>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                poiArray.append({
                  id: undefined,
                  name: "",
                  description: "",
                  category: poiCategories[0].value,
                  coordinates: [56.5, 84.97],
                })
              }
            >
              Добавить точку
            </Button>
          </div>

          <div className="space-y-6">
            {poiArray.fields.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Пока нет точек. Добавьте воду, смотровые площадки или транспорт.
              </p>
            ) : null}

            {poiArray.fields.map((field, index) => (
              <div key={field.id} className="rounded-2xl border border-dashed border-border bg-background/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">Точка #{index + 1}</p>
                  <Button type="button" variant="ghost" size="sm" onClick={() => poiArray.remove(index)}>
                    Удалить
                  </Button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`pointsOfInterest.${index}.name` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название</FormLabel>
                        <FormControl>
                          <Input placeholder="Например, Видовая точка" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`pointsOfInterest.${index}.category` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Категория</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={field.value}
                            onChange={field.onChange}
                          >
                            {poiCategories.map((category) => (
                              <option key={category.value} value={category.value}>
                                {category.label}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name={`pointsOfInterest.${index}.description` as const}
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Что важно знать про эту точку"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`pointsOfInterest.${index}.coordinates.1` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Широта</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.0001"
                            value={field.value ?? ""}
                            onChange={(event) => field.onChange(Number(event.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`pointsOfInterest.${index}.coordinates.0` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Долгота</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.0001"
                            value={field.value ?? ""}
                            onChange={(event) => field.onChange(Number(event.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Авторы и статус</h2>
          <FormField
            control={form.control}
            name="authors"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Авторы маршрута</FormLabel>
                <div className="grid gap-2 rounded-2xl border border-dashed border-border bg-background/80 p-4">
                  {authors.map((author) => {
                    const checked = field.value?.includes(author.id);
                    return (
                      <label key={author.id} className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          {author.name ?? author.email}
                          <span className="ml-2 text-xs text-muted-foreground/80">
                            {author.roles.join(", ")}
                          </span>
                        </span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border"
                          checked={checked}
                          onChange={(event) => {
                            if (event.target.checked) {
                              field.onChange([...(field.value ?? []), author.id]);
                            } else {
                              field.onChange((field.value ?? []).filter((id) => id !== author.id));
                            }
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Статус маршрута</FormLabel>
                <FormControl>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={field.value ?? "DRAFT"}
                    onChange={field.onChange}
                  >
                    {ROUTE_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormDescription>{getStatusLabel(field.value ?? "DRAFT")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="grid gap-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Предпросмотр</h2>
            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-4">
                <div className="rounded-3xl border border-border bg-background/90 p-6 shadow-sm">
                  <h3 className="text-2xl font-semibold text-foreground">{values.title || "Предпросмотр маршрута"}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{values.summary || "Краткое описание появится здесь."}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                      {getDifficultyLabel(values.difficulty)}
                    </span>
                    <span className="rounded-full border border-border px-3 py-1">
                      {formatDistance(values.distanceKm ?? 0)}
                    </span>
                    <span className="rounded-full border border-border px-3 py-1">
                      {formatDuration(values.durationMinutes ?? 0)}
                    </span>
                  </div>
                </div>
                <div className="rounded-3xl border border-border bg-background/90 p-6 shadow-sm">
                  <RouteDescription markdown={values.descriptionMarkdown} />
                </div>
              </div>
              <div className="space-y-4">
                {preview ? (
                  <div className="overflow-hidden rounded-3xl border border-border shadow">
                    <Image
                      src={preview.dataUrl}
                      alt="Превью маршрута"
                      width={preview.width}
                      height={preview.height}
                      unoptimized
                      className="w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-3xl border border-dashed border-border text-sm text-muted-foreground">
                    {isGeneratingPreview ? "Генерируем превью..." : "Загрузите трек, чтобы увидеть превью"}
                  </div>
                )}
                {values.coverImageUrl ? (
                  <div className="overflow-hidden rounded-3xl border border-border shadow">
                    <Image
                      src={values.coverImageUrl}
                      alt="Обложка"
                      width={800}
                      height={400}
                      unoptimized
                      className="w-full object-cover"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
        {submitSuccess ? <p className="text-sm text-emerald-600">{submitSuccess}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onSubmit("DRAFT")}>Сохранить черновик</Button>
          <Button type="button" variant="secondary" disabled={isSubmitting} onClick={() => onSubmit("REVIEW")}>
            Отправить на модерацию
          </Button>
          {canPublish ? (
            <Button type="button" disabled={isSubmitting} onClick={() => onSubmit("PUBLISHED")}>Опубликовать</Button>
          ) : null}
        </div>
      </form>
    </Form>
  );
}
