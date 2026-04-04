import { useMemo } from "react";
import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { Controller, useFieldArray } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { ConfigBox } from "@/Components/design-elements";
import { TextField, Autocomplete, Button } from "@/Components/inputs";
import { LAYOUT } from "@/Utils/Theme/constants";
import { Trash2, Plus } from "lucide-react";
import type { Notification } from "@/Types/Notification";

interface EscalatedNotificationsBoxProps {
	control: any;
	notifications: Notification[] | undefined;
	watch: any;
}

export const EscalatedNotificationsBox = ({
	control,
	notifications,
	watch,
}: EscalatedNotificationsBoxProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { fields, append, remove } = useFieldArray({
		control,
		name: "escalatedNotifications",
	});

	const notificationOptions = useMemo(
		() =>
			(notifications ?? []).map((n) => ({
				...n,
				name: n.notificationName,
			})),
		[notifications]
	);

	const watchedEscalations = watch("escalatedNotifications");

	const handleAddEscalation = () => {
		append({
			notificationIds: [],
			delayMinutes: 5,
		});
	};

	if (!notifications || notifications.length === 0) {
		return null;
	}

	return (
		<ConfigBox
			title={t("pages.createMonitor.form.escalatedNotifications.title")}
			subtitle={t("pages.createMonitor.form.escalatedNotifications.description")}
			rightContent={
				<Stack
					spacing={theme.spacing(LAYOUT.MD)}
					width="100%"
				>
					{fields.length === 0 ? (
						<Stack spacing={theme.spacing(LAYOUT.SM)}>
							<Typography
								variant="body2"
								color="text.secondary"
							>
								{t("pages.createMonitor.form.escalatedNotifications.empty")}
							</Typography>
							<Button
								variant="outlined"
								onClick={handleAddEscalation}
								startIcon={<Plus size={16} />}
								size="small"
							>
								{t("pages.createMonitor.form.escalatedNotifications.addButton")}
							</Button>
						</Stack>
					) : (
						<>
							{fields.map((field, index) => {
								const selectedNotifications = notificationOptions.filter((n) =>
									(watchedEscalations?.[index]?.notificationIds ?? []).includes(n.id)
								);

								return (
									<Stack
										key={field.id}
										spacing={theme.spacing(LAYOUT.MD)}
										sx={{
											p: theme.spacing(LAYOUT.MD),
											border: `1px solid ${theme.palette.divider}`,
											borderRadius: 1,
										}}
									>
										<Stack
											direction="row"
											justifyContent="space-between"
											alignItems="center"
										>
											<Typography
												variant="subtitle2"
												fontWeight={600}
											>
												{t(
													"pages.createMonitor.form.escalatedNotifications.escalationLevel",
													{
														number: index + 1,
													}
												)}
											</Typography>
											<IconButton
												size="small"
												onClick={() => remove(index)}
												aria-label="Remove escalation"
											>
												<Trash2 size={16} />
											</IconButton>
										</Stack>

										<Controller
											name={`escalatedNotifications.${index}.delayMinutes`}
											control={control}
											render={({ field, fieldState }) => (
												<TextField
													{...field}
													type="number"
													fieldLabel={t(
														"pages.createMonitor.form.escalatedNotifications.delayMinutes"
													)}
													placeholder="e.g., 5, 15, 30"
													fullWidth
													inputProps={{ min: 1, max: 10080 }}
													error={!!fieldState.error}
													helperText={
														fieldState.error?.message ??
														t(
															"pages.createMonitor.form.escalatedNotifications.delayHelper"
														)
													}
												/>
											)}
										/>

										<Controller
											name={`escalatedNotifications.${index}.notificationIds`}
											control={control}
											render={({ field, fieldState }) => (
												<Stack spacing={theme.spacing(LAYOUT.SM)}>
													<Autocomplete
														multiple
														options={notificationOptions}
														value={selectedNotifications}
														getOptionLabel={(option) => option.name}
														onChange={(
															_: unknown,
															newValue: typeof notificationOptions
														) => {
															field.onChange(newValue.map((n: { id: any }) => n.id));
														}}
														isOptionEqualToValue={(option, value) =>
															option.id === value.id
														}
														fieldLabel={t(
															"pages.createMonitor.form.escalatedNotifications.selectNotifications"
														)}
													/>
													{fieldState.error && (
														<Typography
															color="error"
															variant="caption"
														>
															{fieldState.error.message}
														</Typography>
													)}
													{selectedNotifications.length > 0 && (
														<Stack spacing={theme.spacing(LAYOUT.XS)}>
															{selectedNotifications.map((notification, notifIndex) => (
																<Typography
																	key={notification.id}
																	variant="body2"
																	flexGrow={1}
																>
																	{notification.notificationName}
																</Typography>
															))}
														</Stack>
													)}
												</Stack>
											)}
										/>
									</Stack>
								);
							})}

							<Button
								variant="outlined"
								onClick={handleAddEscalation}
								startIcon={<Plus size={16} />}
								fullWidth
							>
								{t("pages.createMonitor.form.escalatedNotifications.addButton")}
							</Button>
						</>
					)}
				</Stack>
			}
		/>
	);
};
