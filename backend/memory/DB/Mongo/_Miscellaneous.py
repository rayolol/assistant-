from memory.DB.schemas import PromptSettings
from datetime import datetime



class PromptSettingsOps:
    async def create(self, user_id: str, display_name: str, custom_prompt: str, occupation: str, interests: str, about_me: str):
        prompt_settings = PromptSettings(user_id=user_id, display_name=display_name, custom_prompt=custom_prompt, occupation=occupation, interests=interests, about_me=about_me, updated_at=datetime.now())
        await prompt_settings.insert()
        return prompt_settings

    async def get_by_user_id(self, user_id: str):
        return await PromptSettings.find_one(PromptSettings.user_id == user_id)

    async def update(self, user_id: str, display_name: str, custom_prompt: str, occupation: str, interests: str, about_me: str):
        prompt_settings = await self.get_by_user_id(user_id)
        if prompt_settings:
            prompt_settings.updated_at = datetime.now()
            prompt_settings.display_name = display_name
            prompt_settings.custom_prompt = custom_prompt
            prompt_settings.occupation = occupation
            prompt_settings.interests = interests
            prompt_settings.about_me = about_me
            await prompt_settings.save()
        else:
            prompt_settings = PromptSettings(user_id=user_id, display_name=display_name, custom_prompt=custom_prompt, occupation=occupation, interests=interests, about_me=about_me)
            await prompt_settings.insert()
        return prompt_settings

    async def delete(self, user_id: str):
        prompt_settings = await self.get_by_user_id(user_id)
        if prompt_settings:
            await prompt_settings.delete()
        return prompt_settings
